import { Engine, Mino, type EngineSnapshot } from "@haelp/teto/engine";
import { DEFAULT_CONFIG } from "./config";
import { BOARD_COLUMNS, createEngineOptions, settleSpawn } from "./engineOptions";
import {
	boxBlocks,
	leftmost,
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

const cellsKey = (cells: ReadonlyArray<Block>): string =>
	cells
		.map(([x, y]) => `${x},${y}`)
		.sort()
		.join(" ");

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

const landingKey = ({ falling }: Engine): string => {
	const cells = falling.absoluteBlocks;
	const bottom = Math.min(...cells.map(([, y]) => y));

	return cellsKey(cells.map(([x, y]): Block => [x, y - bottom]));
};

const routesTo = (position: Position): Array<Array<Move>> =>
	position.arrivals.length === 0
		? [[]]
		: position.arrivals.flatMap(({ from, move }) => routesTo(from).map((route) => [...route, move]));

const searchPositions = (mino: Piece, moves: ReadonlyArray<Move>): Array<Position> => {
	const engine = new Engine(createEngineOptions(DEFAULT_CONFIG.handling, 1));

	engine.initiatePiece(mino);
	settleSpawn(engine);

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

const shortestRoutes = (target: PieceTarget, options: FinesseOptions): Array<Array<Move>> => {
	const key = `${target.mino} ${options.allow180}`;
	const byLanding = searched.get(key) ?? shortestByLanding(target.mino, options);

	searched.set(key, byLanding);

	const routes = byLanding.get(shapeKey(target))?.routes;

	if (!routes) throw new Error(`No route reaches ${target.mino} ${target.orientation} at column ${target.column}`);

	return routes;
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

	return shortestRoutes(target, options)
		.map((route) => ({ route, key: tieKey(route, classic) }))
		.sort((first, second) => compareKeys(first.key, second.key))
		.map(({ route }) => route.map((move) => move.step));
};

export const minimalPresses = (target: PieceTarget, options: FinesseOptions): number =>
	shortestRoutes(target, options)[0]?.length ?? 0;

export const finesseSteps = (target: PieceTarget): Array<ScriptStep> =>
	finesseRoutes(target, { allow180: true })[0] ?? [];

export const dropSteps = (placement: Placement): Array<ScriptStep> => [...finesseSteps(placement), { tap: "hardDrop" }];
