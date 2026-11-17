import { Engine, Mino, type EngineSnapshot } from "@haelp/teto/engine";
import { DEFAULT_CONFIG, type Handling } from "./config";
import { BOARD_COLUMNS, createEngineOptions, settleSpawn } from "./engineOptions";
import { Game } from "./Game";
import { isDasPress, isMoveOrTurnKey, isShiftKey, type KeyPress } from "./inputs";
import {
	boxBlocks,
	cellsKey,
	leftmost,
	lowest,
	ORIENTATIONS,
	pieceShape,
	placementCells,
	type Block,
	type Piece,
	type Placement,
} from "./pieces";
import type { ScriptStep } from "./script";

export type PieceTarget = Omit<Placement, "row">;

export interface FinesseOptions {
	readonly allow180: boolean;
}

interface Move {
	readonly step: ScriptStep;
	readonly apply: (engine: Engine) => unknown;
}

interface Position {
	readonly snapshot: EngineSnapshot;
	readonly landing: string;
	readonly presses: number;
	readonly arrivals: Array<{ readonly from: Position; readonly move: Move }>;
}

interface Shortest {
	readonly presses: number;
	readonly routes: Array<Array<Move>>;
}

const TAP_LEFT: Move = { step: { tap: "moveLeft" }, apply: (engine) => engine.moveLeft() };
const TAP_RIGHT: Move = { step: { tap: "moveRight" }, apply: (engine) => engine.moveRight() };
const DAS_LEFT: Move = { step: { das: "moveLeft" }, apply: (engine) => engine.dasLeft() };
const DAS_RIGHT: Move = { step: { das: "moveRight" }, apply: (engine) => engine.dasRight() };
const ROTATE_CW: Move = { step: { tap: "rotateCW" }, apply: (engine) => engine.rotateCW() };
const ROTATE_CCW: Move = { step: { tap: "rotateCCW" }, apply: (engine) => engine.rotateCCW() };
const ROTATE_180: Move = { step: { tap: "rotate180" }, apply: (engine) => engine.rotate180() };

const MOVES: ReadonlyArray<Move> = [TAP_LEFT, TAP_RIGHT, DAS_LEFT, DAS_RIGHT, ROTATE_CW, ROTATE_CCW, ROTATE_180];

const ROTATIONS: ReadonlyArray<Move> = [ROTATE_CW, ROTATE_CCW, ROTATE_180];

const ORIENTATION_MOVES: ReadonlyArray<Move | undefined> = [undefined, ROTATE_CW, ROTATE_180, ROTATE_CCW];

const TARGET_PIECES: ReadonlyArray<Piece> = [Mino.O, Mino.I, Mino.T, Mino.J, Mino.L, Mino.S, Mino.Z];

const shapeKey = (target: PieceTarget): string => cellsKey(placementCells({ ...target, row: 0 }));

const spawnBoxColumn = (target: PieceTarget): number =>
	Math.floor(BOARD_COLUMNS / 2 - pieceShape(target.mino).matrix.w / 2);

const taps = (from: number, to: number): Array<Move> =>
	Array.from({ length: Math.abs(to - from) }, () => (to < from ? TAP_LEFT : TAP_RIGHT));

const shifts = (from: number, to: number, width: number): Array<Array<Move>> => [
	taps(from, to),
	[DAS_LEFT, ...taps(0, to)],
	[DAS_RIGHT, ...taps(BOARD_COLUMNS - width, to)],
];

const classicRoute = (target: PieceTarget): Array<Move> => {
	const shape = shapeKey(target);

	return ORIENTATIONS.flatMap((orientation, rotation) => {
		if (shapeKey({ ...target, orientation }) !== shape) return [];

		const blocks = boxBlocks(target.mino, rotation);
		const width = Math.max(...blocks.map(([x]) => x)) - leftmost(blocks) + 1;
		const rotationMove = ORIENTATION_MOVES[rotation];
		const rotate = rotationMove ? [rotationMove] : [];

		return shifts(spawnBoxColumn(target) + leftmost(blocks), target.column, width).map((shift) => [
			...rotate,
			...shift,
		]);
	}).reduce((best, route) => (route.length < best.length ? route : best));
};

const positionKey = ({ falling }: Engine): string =>
	`${falling.location[0]},${falling.location[1]},${falling.rotation}`;

const landingCells = ({ falling }: Engine): Array<Block> => {
	const cells = falling.absoluteBlocks;
	const bottom = lowest(cells);

	return cells.map(([x, y]): Block => [x, y - bottom]);
};

const landingKey = (engine: Engine): string => cellsKey(landingCells(engine));

const routesTo = (position: Position): Array<Array<Move>> =>
	position.arrivals.length === 0
		? [[]]
		: position.arrivals.flatMap(({ from, move }) => routesTo(from).map((route) => [...route, move]));

const spawnEngine = (mino: Piece): Engine => {
	const engine = new Engine(createEngineOptions(DEFAULT_CONFIG.handling, 1));

	engine.initiatePiece(mino);
	settleSpawn(engine);

	return engine;
};

const searchPositions = (mino: Piece, moves: ReadonlyArray<Move>): Array<Position> => {
	const engine = spawnEngine(mino);
	const spawn: Position = { snapshot: engine.snapshot(), landing: landingKey(engine), presses: 0, arrivals: [] };
	const positions = new Map([[positionKey(engine), spawn]]);
	let layer = [spawn];

	while (layer.length > 0) {
		const reached: Array<Position> = [];

		for (const from of layer)
			for (const move of moves) {
				engine.fromSnapshot(from.snapshot);
				move.apply(engine);

				const key = positionKey(engine);
				const known = positions.get(key);

				if (known === undefined) {
					const position: Position = {
						snapshot: engine.snapshot(),
						landing: landingKey(engine),
						presses: from.presses + 1,
						arrivals: [{ from, move }],
					};

					positions.set(key, position);
					reached.push(position);
				} else if (known.presses === from.presses + 1) known.arrivals.push({ from, move });
			}

		layer = reached;
	}

	return [...positions.values()];
};

const shortestByLanding = (mino: Piece, options: FinesseOptions): Map<string, Shortest> => {
	const moves = options.allow180 ? MOVES : MOVES.filter((move) => move !== ROTATE_180);
	const shortest = new Map<string, Shortest>();

	for (const position of searchPositions(mino, moves)) {
		const best = shortest.get(position.landing);

		if (best === undefined || position.presses < best.presses)
			shortest.set(position.landing, { presses: position.presses, routes: routesTo(position) });
		else if (position.presses === best.presses) best.routes.push(...routesTo(position));
	}

	return shortest;
};

const searched = new Map<string, Map<string, Shortest>>();

const shortestTo = (target: PieceTarget, options: FinesseOptions): Shortest => {
	const key = `${target.mino} ${options.allow180}`;
	const byLanding = searched.get(key) ?? shortestByLanding(target.mino, options);

	searched.set(key, byLanding);

	const shortest = byLanding.get(shapeKey(target));

	if (!shortest) throw new Error(`No route reaches ${target.mino} ${target.orientation} at column ${target.column}`);

	return shortest;
};

const leadingRotations = (route: ReadonlyArray<Move>): number => {
	const firstShift = route.findIndex((move) => !ROTATIONS.includes(move));

	return firstShift === -1 ? route.length : firstShift;
};

const tieKey = (route: ReadonlyArray<Move>, classic: ReadonlyArray<Move>): Array<number> => [
	route.length === classic.length && route.every((move, index) => move === classic[index]) ? 0 : 1,
	-leadingRotations(route),
	...route.map((move) => MOVES.indexOf(move)),
];

const compareKeys = (first: ReadonlyArray<number>, second: ReadonlyArray<number>): number =>
	first.reduce((order, value, index) => order || value - (second[index] ?? 0), 0);

export const finesseTargets = (): Array<PieceTarget> =>
	TARGET_PIECES.flatMap((mino) =>
		ORIENTATIONS.flatMap((orientation, rotation) =>
			Array.from({ length: BOARD_COLUMNS }, (_, column): PieceTarget => ({ mino, orientation, column })).filter(
				(target) =>
					placementCells({ ...target, row: 0 }).every(([x]) => x < BOARD_COLUMNS) &&
					ORIENTATIONS.slice(0, rotation).every(
						(earlier) => shapeKey({ ...target, orientation: earlier }) !== shapeKey(target),
					),
			),
		),
	);

export const finesseRoutes = (target: PieceTarget, options: FinesseOptions): Array<Array<ScriptStep>> => {
	const classic = classicRoute(target);

	return shortestTo(target, options)
		.routes.map((route) => ({ route, key: tieKey(route, classic) }))
		.sort((first, second) => compareKeys(first.key, second.key))
		.map(({ route }) => route.map((move) => move.step));
};

export const minimalPresses = (target: PieceTarget, options: FinesseOptions): number =>
	shortestTo(target, options).presses;

const isSameMove = (step: ScriptStep, other: ScriptStep): boolean =>
	("das" in step && "das" in other && step.das === other.das) ||
	("tap" in step && "tap" in other && step.tap === other.tap);

const applyStep = (engine: Engine, step: ScriptStep): void => {
	MOVES.find((move) => isSameMove(move.step, step))?.apply(engine);
};

export const stepsMoved = (mino: Piece, steps: ReadonlyArray<ScriptStep>): Array<boolean> => {
	const engine = spawnEngine(mino);

	const cells = (): string => cellsKey(engine.falling.absoluteBlocks);

	return steps.map((step) => {
		const before = cells();

		applyStep(engine, step);

		return cells() !== before;
	});
};

const replayed = (press: KeyPress, handling: Handling): ScriptStep =>
	isShiftKey(press.key) && (press.carried || isDasPress(press, handling)) ? { das: press.key } : { tap: press.key };

export const pressesReach = (target: PieceTarget, presses: ReadonlyArray<KeyPress>, handling: Handling): boolean => {
	const engine = spawnEngine(target.mino);
	const moves = presses
		.filter((press) => press.source === "user" && isMoveOrTurnKey(press.key))
		.sort((first, second) => first.down - second.down);

	for (const press of moves) {
		applyStep(engine, replayed(press, handling));

		for (const held of moves)
			if (held !== press && held.down <= press.down && press.down < held.up) {
				const step = replayed(held, handling);

				if ("das" in step) applyStep(engine, step);
			}
	}

	return landingKey(engine) === shapeKey(target);
};

const REPLAY_TAIL = 2;

const replayGame = (handling: Handling, mino: Piece): Game => {
	const game = new Game(handling, 1);

	game.load({ board: [], validate: true, queue: { pieces: [mino], mode: "fresh-bag" }, holdEnabled: false, seed: 1 });
	game.setGravity(0);

	return game;
};

export const pathCells = (
	presses: ReadonlyArray<KeyPress>,
	handling: Handling,
	mino: Piece,
): Array<ReadonlyArray<Block>> => {
	const played = presses
		.filter((press) => press.source === "user" && (isMoveOrTurnKey(press.key) || press.key === "softDrop"))
		.sort((first, second) => first.down - second.down);
	const end = Math.max(0, ...played.map((press) => press.up)) + REPLAY_TAIL;
	const capturedAt = (press: KeyPress): number =>
		Math.min(end + 1, ...played.filter((other) => other.down > press.down).map((other) => other.down)) - 1;
	const game = replayGame(handling, mino);
	const landings = new Map<KeyPress, ReadonlyArray<Block>>();
	let ghost: ReadonlyArray<Block> = game.ghost;

	for (let frame = 0; frame <= end; frame++) {
		for (const press of played) if (press.up === frame && press.down < frame) game.release(press.key);

		for (const press of played) if (press.down === frame) game.press(press.key);

		game.step();

		for (const press of played) if (press.up === frame && press.down === frame) game.release(press.key);

		if (game.stats.pieces === 0) ghost = game.ghost;

		for (const press of played) if (capturedAt(press) === frame) landings.set(press, ghost);
	}

	return played.filter((press) => !press.carried).map((press) => landings.get(press) ?? ghost);
};

export const routeCells = (route: ReadonlyArray<ScriptStep>, mino: Piece): Array<ReadonlyArray<Block>> => {
	const engine = spawnEngine(mino);

	return route.map((step) => {
		applyStep(engine, step);

		return landingCells(engine);
	});
};

export const finesseSteps = (target: PieceTarget): Array<ScriptStep> =>
	finesseRoutes(target, { allow180: true })[0] ?? [];

export const dropSteps = (placement: Placement): Array<ScriptStep> => [...finesseSteps(placement), { tap: "hardDrop" }];
