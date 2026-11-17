import { Mino, type SpinType } from "@haelp/teto/engine";
import { BOARD_COLUMNS } from "../engineOptions";
import { BAG, ORIENTATIONS, type Block, type Piece, type Placement } from "../pieces";
import { kickTests } from "../sim/kicks";
import { fits, pieceShapes, shapeCells, shiftedMask, SPAWN_ROW, spawnColumn, type SimShape } from "../sim/shapes";
import { BOARD_ROWS, FULL_ROW, isHoleFree, type SimBoard } from "../sim/simBoard";
import { isTstKick, rotationSpin } from "../sim/spin";
import type { Handling } from "../config";
import type { ScriptStep } from "../script";

export interface MoveRules {
	readonly allow180: boolean;
	readonly excluded: Partial<Record<Piece, ReadonlyArray<number>>>;
	readonly holeFreeOnly: boolean;
	readonly ceiling: number | null;
	readonly quadClearsOnly: boolean;
}

export interface Mover {
	readonly handling: Handling;
	readonly gravity: number;
}

export interface Move {
	readonly placement: Placement;
	readonly cells: ReadonlyArray<Block>;
	readonly spin: SpinType;
	readonly keys: ReadonlyArray<ScriptStep>;
	readonly presses: number;
}

interface PieceMoves {
	readonly shapes: ReadonlyArray<SimShape>;
	readonly kicks: ReadonlyArray<ReadonlyArray<ReadonlyArray<Block>>>;
}

interface Generation {
	readonly board: SimBoard;
	readonly mino: Piece;
	readonly piece: PieceMoves;
	readonly rules: MoveRules;
	readonly mover: Mover;
	readonly excluded: number;
	readonly heights: Int8Array;
	readonly stackTop: number;
	readonly constrained: boolean;
	readonly stamp: number;
	readonly locks: Set<number>;
	readonly moves: Array<Move>;
}

const TAP_LEFT = 0;
const TAP_RIGHT = 1;
const DAS_LEFT = 2;
const DAS_RIGHT = 3;
const ROTATE_CW = 4;
const ROTATE_CCW = 5;
const ROTATE_180 = 6;
const SOFT_DROP = 7;

const EDGE_STEPS: ReadonlyArray<ScriptStep> = [
	{ tap: "moveLeft" },
	{ tap: "moveRight" },
	{ das: "moveLeft" },
	{ das: "moveRight" },
	{ tap: "rotateCW" },
	{ tap: "rotateCCW" },
	{ tap: "rotate180" },
];

const HARD_DROP: ScriptStep = { tap: "hardDrop" };

const SPINS: ReadonlyArray<SpinType> = ["none", "mini", "normal"];

const NO_SPIN = 0;

const LOCK_RESETS = 15;

const RESET_CAP = 31;

const INSTANT_SDF = 41;

const SOFT_DROP_FLOOR = 0.05;

const X_OFFSET = 4;

const X_SLOTS = 16;

const KEY_SPACE = BOARD_ROWS * X_SLOTS * ORIENTATIONS.length * SPINS.length * 2;

const ROW_WEIGHT = 2 ** 10;

const ROWS_WEIGHT = 2 ** 40;

const STATE_CAPACITY = 1 << 15;

const PIECES = new Map<Piece, PieceMoves>(
	BAG.map((mino) => [
		mino,
		{
			shapes: pieceShapes(mino),
			kicks: ORIENTATIONS.map((_, from) =>
				ORIENTATIONS.map((_orientation, to): ReadonlyArray<Block> => [[0, 0], ...kickTests(mino, from, to)]),
			),
		},
	]),
);

const seenStamp = new Uint32Array(KEY_SPACE);

const seenResets = new Uint8Array(KEY_SPACE);

const landedStamp = new Uint32Array(KEY_SPACE);

const stateX = new Int8Array(STATE_CAPACITY);

const stateY = new Int8Array(STATE_CAPACITY);

const stateRotation = new Uint8Array(STATE_CAPACITY);

const stateSpin = new Uint8Array(STATE_CAPACITY);

const stateResets = new Uint8Array(STATE_CAPACITY);

const stateLowest = new Int8Array(STATE_CAPACITY);

const stateDropped = new Uint8Array(STATE_CAPACITY);

const stateParent = new Int32Array(STATE_CAPACITY);

const stateEdge = new Uint8Array(STATE_CAPACITY);

const stateFallen = new Uint8Array(STATE_CAPACITY);

const statePresses = new Uint16Array(STATE_CAPACITY);

let stateCount = 0;

let stamp = 0;

const nextStamp = (): number => {
	if (stamp === 0xffffffff) {
		seenStamp.fill(0);
		landedStamp.fill(0);
		stamp = 0;
	}

	return ++stamp;
};

const pieceMoves = (mino: Piece): PieceMoves => {
	const piece = PIECES.get(mino);

	if (!piece) throw new Error(`No moves for mino "${mino}"`);

	return piece;
};

const shapeOf = (generation: Generation, rotation: number): SimShape => {
	const shape = generation.piece.shapes[rotation];

	if (!shape) throw new Error(`No shape for rotation ${rotation}`);

	return shape;
};

const columnHeights = (board: SimBoard): Int8Array => {
	const heights = new Int8Array(BOARD_COLUMNS);

	board.rows.forEach((row, y) => {
		for (let x = 0; x < BOARD_COLUMNS; x++) if ((row & (1 << x)) !== 0) heights[x] = y + 1;
	});

	return heights;
};

const dropRow = (generation: Generation, shape: SimShape, x: number, y: number): number => {
	if (y + shape.bottom >= generation.stackTop) {
		let landing = -shape.bottom;

		for (let column = 0; column < shape.columnBottoms.length; column++)
			landing = Math.max(
				landing,
				(generation.heights[x + shape.left + column] ?? 0) - (shape.columnBottoms[column] ?? 0),
			);

		return landing;
	}

	let row = y;

	while (fits(generation.board, shape, x, row - 1)) row--;

	return row;
};

const softDropFrames = (rows: number, { handling, gravity }: Mover): number =>
	handling.sdf === INSTANT_SDF
		? 1
		: Math.ceil(rows / Math.max(gravity * handling.sdf, SOFT_DROP_FLOOR * handling.sdf)) + 1;

const pathKeys = (index: number, mover: Mover): Array<ScriptStep> => {
	const steps: Array<ScriptStep> = [HARD_DROP];

	for (let at = index; (stateParent[at] ?? -1) >= 0; at = stateParent[at] ?? -1) {
		const edge = stateEdge[at] ?? 0;

		steps.unshift(
			edge === SOFT_DROP
				? { hold: "softDrop", frames: softDropFrames(stateFallen[at] ?? 0, mover) }
				: (EDGE_STEPS[edge] ?? HARD_DROP),
		);
	}

	return steps;
};

const excludedMask = (columns: ReadonlyArray<number> | undefined): number =>
	(columns ?? []).reduce((mask, column) => mask | (1 << column), 0);

const positionKey = (x: number, y: number, rotation: number, spin: number): number =>
	((y * X_SLOTS + x + X_OFFSET) * ORIENTATIONS.length + rotation) * SPINS.length + spin;

const lockKey = (shape: SimShape, x: number, landing: number, spin: number): number => {
	let rows = 0;

	for (let index = shape.rowMasks.length - 1; index >= 0; index--)
		rows = rows * ROW_WEIGHT + shiftedMask(shape.rowMasks[index] ?? 0, x);

	return ((landing + shape.bottom) * SPINS.length + spin) * ROWS_WEIGHT + rows;
};

const isAllowedLock = (generation: Generation, shape: SimShape, x: number, landing: number): boolean => {
	const { board, rules, excluded } = generation;
	let lines = 0;

	for (let index = 0; index < shape.rowOffsets.length; index++) {
		const mask = shiftedMask(shape.rowMasks[index] ?? 0, x);

		if ((mask & excluded) !== 0) return false;

		if (((board.rows[landing + (shape.rowOffsets[index] ?? 0)] ?? 0) | mask) === FULL_ROW) lines++;
	}

	if (rules.ceiling !== null && landing + shape.top >= rules.ceiling) return false;

	if (rules.quadClearsOnly && lines > 0 && lines < 4) return false;

	return !rules.holeFreeOnly || isHoleFree(board, shapeCells(shape, x, landing));
};

const recordLock = (generation: Generation, index: number, shape: SimShape, landing: number): void => {
	const x = stateX[index] ?? 0;
	const rotation = stateRotation[index] ?? 0;
	const spin = landing === stateY[index] ? (stateSpin[index] ?? NO_SPIN) : NO_SPIN;
	const landed = positionKey(x, landing, rotation, spin);

	if (landedStamp[landed] === generation.stamp) return;

	landedStamp[landed] = generation.stamp;

	const key = lockKey(shape, x, landing, spin);

	if (generation.locks.has(key)) return;

	generation.locks.add(key);

	if (!isAllowedLock(generation, shape, x, landing)) return;

	generation.moves.push({
		placement: {
			mino: generation.mino,
			orientation: ORIENTATIONS[rotation] ?? "spawn",
			column: x + shape.left,
			row: landing + shape.bottom,
		},
		cells: shapeCells(shape, x, landing),
		spin: SPINS[spin] ?? "none",
		keys: pathKeys(index, generation.mover),
		presses: statePresses[index] ?? 0,
	});
};

const visit = (
	generation: Generation,
	parent: number,
	edge: number,
	x: number,
	y: number,
	rotation: number,
	spin: number,
	resets: number,
	lowest: number,
	dropped: number,
	fallen: number,
): void => {
	if (resets >= LOCK_RESETS && !fits(generation.board, shapeOf(generation, rotation), x, y - 1)) return;

	const key = (positionKey(x, y, rotation, spin) << 1) | dropped;

	if (seenStamp[key] === generation.stamp && (seenResets[key] ?? 0) <= resets) return;

	if (stateCount === STATE_CAPACITY) throw new Error("Move generation ran out of states");

	seenStamp[key] = generation.stamp;
	seenResets[key] = resets;

	const index = stateCount++;

	stateX[index] = x;
	stateY[index] = y;
	stateRotation[index] = rotation;
	stateSpin[index] = spin;
	stateResets[index] = resets;
	stateLowest[index] = lowest;
	stateDropped[index] = dropped;
	stateParent[index] = parent;
	stateEdge[index] = edge;
	stateFallen[index] = fallen;
	statePresses[index] = parent < 0 ? 0 : (statePresses[parent] ?? 0) + 1;
};

const tap = (generation: Generation, index: number, edge: number, step: number): void => {
	visit(
		generation,
		index,
		edge,
		(stateX[index] ?? 0) + step,
		stateY[index] ?? 0,
		stateRotation[index] ?? 0,
		stateSpin[index] ?? NO_SPIN,
		Math.min((stateResets[index] ?? 0) + 1, RESET_CAP),
		stateLowest[index] ?? 0,
		stateDropped[index] ?? 0,
		0,
	);
};

const das = (generation: Generation, index: number, shape: SimShape, edge: number, step: number): void => {
	const { board } = generation;
	const y = stateY[index] ?? 0;
	const dropped = stateDropped[index] ?? 0;
	const airborneStops = generation.constrained && dropped === 1;
	let x = (stateX[index] ?? 0) + step;
	let resets = (stateResets[index] ?? 0) + 1;
	const checksGround = airborneStops || resets + BOARD_COLUMNS > LOCK_RESETS;

	if (!fits(board, shape, x + step, y)) return;

	while (fits(board, shape, x + step, y)) {
		if (checksGround && (fits(board, shape, x, y - 1) ? airborneStops : resets >= LOCK_RESETS)) return;

		x += step;
		resets = Math.min(resets + 1, RESET_CAP);
	}

	if (checksGround && airborneStops && fits(board, shape, x, y - 1)) return;

	visit(
		generation,
		index,
		edge,
		x,
		y,
		stateRotation[index] ?? 0,
		stateSpin[index] ?? NO_SPIN,
		resets,
		stateLowest[index] ?? 0,
		dropped,
		0,
	);
};

const rotate = (generation: Generation, index: number, edge: number, turn: number): void => {
	const { board, mino } = generation;
	const from = stateRotation[index] ?? 0;
	const rotation = (from + turn) % ORIENTATIONS.length;
	const shape = shapeOf(generation, rotation);
	const startX = stateX[index] ?? 0;
	const startY = stateY[index] ?? 0;
	const tests = generation.piece.kicks[from]?.[rotation] ?? [];

	for (let test = 0; test < tests.length; test++) {
		const kick = tests[test] ?? [0, 0];
		const x = startX + kick[0];
		const y = startY + kick[1];

		if (fits(board, shape, x, y)) {
			const tstKick = test > 0 && mino === Mino.T && isTstKick(from, rotation, kick);
			const spin = SPINS.indexOf(rotationSpin(board, mino, rotation, x, y, tstKick));

			visit(
				generation,
				index,
				edge,
				x,
				y,
				rotation,
				spin,
				Math.min((stateResets[index] ?? 0) + 1, RESET_CAP),
				stateLowest[index] ?? 0,
				stateDropped[index] ?? 0,
				0,
			);

			return;
		}
	}
};

const expand = (generation: Generation, index: number): void => {
	const shape = shapeOf(generation, stateRotation[index] ?? 0);
	const y = stateY[index] ?? 0;
	const lowest = stateLowest[index] ?? 0;
	const landing = dropRow(generation, shape, stateX[index] ?? 0, y);

	recordLock(generation, index, shape, landing);

	if (!(generation.constrained && stateDropped[index] === 1 && landing < y)) {
		const x = stateX[index] ?? 0;
		const canLeft = fits(generation.board, shape, x - 1, y);
		const canRight = fits(generation.board, shape, x + 1, y);

		if (canLeft) tap(generation, index, TAP_LEFT, -1);

		if (canRight) tap(generation, index, TAP_RIGHT, 1);

		if (canLeft) das(generation, index, shape, DAS_LEFT, -1);

		if (canRight) das(generation, index, shape, DAS_RIGHT, 1);

		rotate(generation, index, ROTATE_CW, 1);
		rotate(generation, index, ROTATE_CCW, 3);

		if (generation.rules.allow180) rotate(generation, index, ROTATE_180, 2);
	}

	if (landing < y)
		visit(
			generation,
			index,
			SOFT_DROP,
			stateX[index] ?? 0,
			landing,
			stateRotation[index] ?? 0,
			NO_SPIN,
			landing < lowest ? 0 : (stateResets[index] ?? 0),
			Math.min(landing, lowest),
			generation.constrained ? 1 : 0,
			y - landing,
		);
};

export const generateMoves = (board: SimBoard, mino: Piece, rules: MoveRules, mover: Mover): Array<Move> => {
	const heights = columnHeights(board);
	const generation: Generation = {
		board,
		mino,
		piece: pieceMoves(mino),
		rules,
		mover,
		excluded: excludedMask(rules.excluded[mino]),
		heights,
		stackTop: Math.max(...heights),
		constrained: mover.gravity > 0,
		stamp: nextStamp(),
		locks: new Set(),
		moves: [],
	};
	const spawnShape = shapeOf(generation, 0);
	const x = spawnColumn(mino);
	const y = fits(board, spawnShape, x, SPAWN_ROW - 1) ? SPAWN_ROW - 1 : SPAWN_ROW;

	if (!fits(board, spawnShape, x, y)) return [];

	stateCount = 0;
	visit(generation, -1, 0, x, y, 0, NO_SPIN, 0, y, 0, 0);

	for (let index = 0; index < stateCount; index++) expand(generation, index);

	return generation.moves;
};
