import {
	BAG,
	BOARD_COLUMNS,
	DEMO_HANDLING,
	generateMoves,
	Mino,
	ORIENTATIONS,
	placementCells,
	type Block,
	type Move,
	type Mover,
	type MoveRules,
	type Orientation,
	type Piece,
	type Placement,
	type ScriptStep,
	type SimBoard,
	type SpinType,
} from "@tetris-trainer/game";
import { passingMoves, type Goal } from "./goal";
import { nextSeed, seeded, type Random } from "./random";
import { boardRows, drawSketch, isOpenAbove, sketchTop, type Roof, type Sketch } from "./sketch";

export type FamilyId = "hard-drop" | "tuck" | "tsd" | "tss" | "tst" | "mini" | "s-z" | "l-j";

export interface TargetRound {
	readonly family: FamilyId;
	readonly seed: number;
	readonly rows: ReadonlyArray<string>;
	readonly mino: Piece;
	readonly target: Placement;
	readonly goal: Goal;
}

interface Candidate {
	readonly sketch: Sketch;
	readonly goal: Goal;
}

type Build = (random: Random) => Candidate | null;

const VERIFY_MOVER: Mover = { handling: DEMO_HANDLING, gravity: 0 };

const ATTEMPTS = 400;

const MAX_TOP = 13;

const MAX_FLOOR = 3;

const EXTRA_HEIGHTS: ReadonlyArray<number> = [0, 0, 1, 1, 2];

const SIDES: ReadonlyArray<number> = [-1, 1];

const SPIN_RANK: Readonly<Record<SpinType, number>> = { none: 0, mini: 1, normal: 2 };

export const moveRules = (allow180: boolean): MoveRules => ({
	allow180,
	excluded: {},
	holeFreeOnly: false,
	ceiling: null,
	quadClearsOnly: false,
	deadRows: 0,
});

const columnsOf = (cells: ReadonlyArray<Block>): Array<number> => [...new Set(cells.map(([x]) => x))];

const isOnBoard = (column: number): boolean => column >= 0 && column < BOARD_COLUMNS;

const floorHoles = (random: Random, avoid: ReadonlyArray<number>): Array<number> => {
	const free = Array.from({ length: BOARD_COLUMNS }, (_, column) => column).filter(
		(column) => !avoid.includes(column),
	);
	const holes: Array<number> = [];

	for (let count = random.below(MAX_FLOOR + 1); holes.length < count;) {
		const hole = random.pick(free);

		if (hole !== holes.at(-1)) holes.push(hole);
	}

	return holes;
};

const placed = (mino: Piece, orientation: Orientation, column: number, row: number): Placement => ({
	mino,
	orientation,
	column,
	row,
});

interface Frame {
	readonly target: Placement;
	readonly paths: ReadonlyArray<Block>;
	readonly roofs: ReadonlyArray<Roof>;
	readonly fixed: ReadonlyMap<number, number>;
	readonly holes: ReadonlyArray<number>;
}

const sketchOf = (random: Random, { target, paths, roofs, fixed, holes }: Frame): Sketch => {
	const open = columnsOf([...placementCells(target), ...paths]);
	const top = sketchTop({ target, paths, roofs, heights: new Map(), holes });
	const heights = new Map(fixed);

	for (let column = 0; column < BOARD_COLUMNS; column++)
		if (!open.includes(column) && !heights.has(column)) heights.set(column, top + 1 + random.pick(EXTRA_HEIGHTS));

	return { target, paths, roofs, heights, holes };
};

const boardWidth = (cells: ReadonlyArray<Block>): number =>
	Math.max(...cells.map(([x]) => x)) - Math.min(...cells.map(([x]) => x)) + 1;

const randomTarget = (random: Random, minos: ReadonlyArray<Piece>, row: number): Placement => {
	const mino = random.pick(minos);
	const orientation = random.pick(ORIENTATIONS);
	const width = boardWidth(placementCells(placed(mino, orientation, 0, 0)));

	return placed(mino, orientation, random.below(BOARD_COLUMNS - width + 1), row);
};

const hardDrop: Build = (random) => {
	const draft = randomTarget(random, BAG, 0);
	const holes = floorHoles(random, columnsOf(placementCells(draft)));
	const target = { ...draft, row: holes.length };

	return {
		sketch: sketchOf(random, { target, paths: [], roofs: [], fixed: new Map(), holes }),
		goal: { kind: "spot", cells: placementCells(target), tuck: false },
	};
};

const shifted = (cells: ReadonlyArray<Block>, by: number): Array<Block> => cells.map(([x, y]) => [x + by, y]);

const tuck: Build = (random) => {
	const draft = randomTarget(random, BAG, 0);
	const cells = placementCells(draft);
	const side = random.pick(SIDES);
	const reach = 1 + random.below(2);
	const steps = Array.from({ length: reach }, (_, index) => shifted(cells, side * (index + 1))).flat();
	const key = new Set(cells.map(([x, y]) => `${x},${y}`));
	const paths = steps.filter(([x, y]) => !key.has(`${x},${y}`));

	if (!paths.every(([x]) => isOnBoard(x))) return null;

	const pathColumns = columnsOf(paths);
	const under = columnsOf(cells).filter((column) => !pathColumns.includes(column));
	const roofCells = 1 + random.below(2);
	const holes = floorHoles(random, columnsOf([...cells, ...paths]));
	const target = { ...draft, row: holes.length };
	const lifted = (blocks: ReadonlyArray<Block>): Array<Block> => blocks.map(([x, y]) => [x, y + holes.length]);
	const top = Math.max(...lifted([...cells, ...paths]).map(([, y]) => y));
	const far = side > 0 ? Math.min(...under) - 1 : Math.max(...under) + 1;
	const fixed = new Map(isOnBoard(far) ? [[far, top + 1 + roofCells + random.below(2)]] : []);

	return {
		sketch: sketchOf(random, {
			target,
			paths: lifted(paths),
			roofs: under.map((column) => ({ column, gap: 0, cells: roofCells })),
			fixed,
			holes,
		}),
		goal: { kind: "spot", cells: placementCells(target), tuck: true },
	};
};

const slotColumns = (centre: number): Array<number> => [centre - 1, centre, centre + 1];

const tSlot = (random: Random, lines: 1 | 2): Candidate | null => {
	const centre = 1 + random.below(BOARD_COLUMNS - 2);
	const side = random.pick(SIDES);
	const holes = floorHoles(random, slotColumns(centre));
	const row = holes.length;
	const target = placed(Mino.T, "reverse", centre - 1, row);
	const roofCells = 1 + random.below(2);
	const wall = centre + 2 * side;
	const open = centre - 2 * side;
	const gapColumns = Array.from({ length: BOARD_COLUMNS }, (_, column) => column).filter(
		(column) => Math.abs(column - centre) >= 3 && Math.sign(column - centre) === -side,
	);

	if (lines === 1 && gapColumns.length === 0) return null;

	const paths: Array<Block> = lines === 1 ? [[random.pick(gapColumns), row + 1]] : [];
	const fixed = new Map<number, number>([
		...(isOnBoard(wall) ? [[wall, row + 3 + roofCells - 1 + random.below(2)] as const] : []),
		...(isOnBoard(open) ? [[open, row + 2] as const] : []),
	]);

	return {
		sketch: sketchOf(random, {
			target,
			paths,
			roofs: [{ column: centre + side, gap: 0, cells: roofCells }],
			fixed,
			holes,
		}),
		goal: { kind: "spin", spin: "normal", lines },
	};
};

const tst: Build = (random) => {
	const nose = random.pick(SIDES);
	const shaft = 1 + random.below(BOARD_COLUMNS - 2);
	const wall = shaft - nose;
	const entry = [shaft + 2 * nose, shaft + 3 * nose];

	if (!isOnBoard(wall) || !entry.every(isOnBoard)) return null;

	const holes = floorHoles(random, [shaft - 1, shaft, shaft + 1]);
	const row = holes.length;
	const target = placed(Mino.T, nose > 0 ? "right" : "left", nose > 0 ? shaft : shaft - 1, row);

	return {
		sketch: sketchOf(random, {
			target,
			paths: [],
			roofs: [{ column: shaft, gap: 1, cells: 1 }],
			fixed: new Map([[wall, row + 5 + random.below(2)], ...entry.map((column) => [column, row + 3] as const)]),
			holes,
		}),
		goal: { kind: "spin", spin: "normal", lines: 3 },
	};
};

const mini: Build = (random) => {
	const centre = 1 + random.below(BOARD_COLUMNS - 2);
	const side = random.pick(SIDES);
	const open = centre - side;
	const holes = floorHoles(random, slotColumns(centre));
	const row = holes.length;

	return {
		sketch: sketchOf(random, {
			target: placed(Mino.T, "spawn", centre - 1, row),
			paths: [[open, row + 1]],
			roofs: [],
			fixed: new Map(),
			holes,
		}),
		goal: { kind: "spin", spin: "mini", lines: 1 },
	};
};

const rowsOf = (cells: ReadonlyArray<Block>): number => new Set(cells.map(([, y]) => y)).size;

const pieceSpin =
	(minos: ReadonlyArray<Piece>): Build =>
	(random) => {
		const draft = randomTarget(random, minos, 0);
		const cells = placementCells(draft);
		const columns = columnsOf(cells);
		const holes = floorHoles(random, columns);
		const target = { ...draft, row: holes.length };
		const roofed = columns.filter(() => random.chance(0.5));

		if (roofed.length === 0 || roofed.length === columns.length) return null;

		const roofs = roofed.map((column) => ({ column, gap: 0, cells: 1 + random.below(2) }));
		const top = target.row + rowsOf(cells) - 1;
		const fixed = new Map<number, number>();

		for (const { column, cells: height } of roofs)
			for (const neighbour of [column - 1, column + 1])
				if (isOnBoard(neighbour) && !columns.includes(neighbour)) fixed.set(neighbour, top + 1 + height);

		return {
			sketch: sketchOf(random, { target, paths: [], roofs, fixed, holes }),
			goal: { kind: "spin", spin: "mini", lines: rowsOf(cells) },
		};
	};

const BUILDS: Readonly<Record<FamilyId, Build>> = {
	"hard-drop": hardDrop,
	tuck,
	tsd: (random) => tSlot(random, 2),
	tss: (random) => tSlot(random, 1),
	tst,
	mini,
	"s-z": pieceSpin([Mino.S, Mino.Z]),
	"l-j": pieceSpin([Mino.L, Mino.J]),
};

const isSlide = (keys: ReadonlyArray<ScriptStep>): boolean => {
	const drops = keys.flatMap((step, index) => ("hold" in step && step.hold === "softDrop" ? [index] : []));
	const drop = drops.at(-1);

	return (
		drop !== undefined && keys.slice(drop + 1).every((step) => !("tap" in step) || !step.tap.startsWith("rotate"))
	);
};

const isBetter = (move: Move, goal: Goal): boolean =>
	goal.kind === "spin" &&
	move.lines > 0 &&
	move.spin !== "none" &&
	(SPIN_RANK[move.spin] > SPIN_RANK[goal.spin] ||
		(SPIN_RANK[move.spin] === SPIN_RANK[goal.spin] && move.lines > goal.lines));

const isIntended = (board: SimBoard, mino: Piece, goal: Goal): boolean => {
	const moves = generateMoves(board, mino, moveRules(false), VERIFY_MOVER);

	const [best] = passingMoves(goal, moves);

	if (best === undefined) return false;

	if (goal.kind === "spot") return isOpenAbove(board, goal.cells) !== goal.tuck && (!goal.tuck || isSlide(best.keys));

	return !generateMoves(board, mino, moveRules(true), VERIFY_MOVER).some((move) => isBetter(move, goal));
};

const roundFrom = (family: FamilyId, seed: number, candidate: Candidate | null): TargetRound | null => {
	if (candidate === null) return null;

	const board = drawSketch(candidate.sketch);
	const { target } = candidate.sketch;

	if (board === null || board.rows.slice(MAX_TOP).some((row) => row !== 0)) return null;

	if (!isIntended(board, target.mino, candidate.goal)) return null;

	return { family, seed, rows: boardRows(board), mino: target.mino, target, goal: candidate.goal };
};

export const targetRound = (family: FamilyId, seed: number): TargetRound => {
	let attempt = seed;

	for (let tries = 0; tries < ATTEMPTS; tries++, attempt = nextSeed(attempt)) {
		const round = roundFrom(family, attempt, BUILDS[family](seeded(attempt)));

		if (round) return round;
	}

	throw new Error(`No ${family} board from seed ${seed}`);
};
