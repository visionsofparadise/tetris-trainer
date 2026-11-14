import { BOARD_COLUMNS } from "./engineOptions";
import { boxBlocks, leftmost, ORIENTATIONS, pieceShape, placementCells, type Placement } from "./pieces";
import type { GameKey, ScriptStep, ShiftKey } from "./script";

export type PieceTarget = Omit<Placement, "row">;

const ROTATION_KEYS: ReadonlyArray<GameKey | null> = [null, "rotateCW", "rotate180", "rotateCCW"];

const spawnBoxColumn = (target: PieceTarget): number =>
	Math.floor(BOARD_COLUMNS / 2 - pieceShape(target.mino).matrix.w / 2);

const shapeKey = (target: PieceTarget): string =>
	placementCells({ ...target, row: 0 })
		.map(([x, y]) => `${x},${y}`)
		.sort()
		.join(" ");

const taps = (from: number, to: number): Array<ScriptStep> => {
	const key: ShiftKey = to < from ? "moveLeft" : "moveRight";

	return Array.from({ length: Math.abs(to - from) }, () => ({ tap: key }));
};

const shifts = (from: number, to: number, width: number): Array<Array<ScriptStep>> => [
	taps(from, to),
	[{ das: "moveLeft" }, ...taps(0, to)],
	[{ das: "moveRight" }, ...taps(BOARD_COLUMNS - width, to)],
];

const routes = (target: PieceTarget): Array<Array<ScriptStep>> => {
	const shape = shapeKey(target);

	return ORIENTATIONS.flatMap((orientation, rotation) => {
		if (shapeKey({ ...target, orientation }) !== shape) return [];

		const blocks = boxBlocks(target.mino, rotation);
		const width = Math.max(...blocks.map(([x]) => x)) - leftmost(blocks) + 1;
		const rotationKey = ROTATION_KEYS[rotation];
		const rotate: Array<ScriptStep> = rotationKey ? [{ tap: rotationKey }] : [];

		return shifts(spawnBoxColumn(target) + leftmost(blocks), target.column, width).map((shift) => [
			...rotate,
			...shift,
		]);
	});
};

export const finesseSteps = (target: PieceTarget): Array<ScriptStep> =>
	routes(target).reduce((best, route) => (route.length < best.length ? route : best));

export const dropSteps = (placement: Placement): Array<ScriptStep> => [...finesseSteps(placement), { tap: "hardDrop" }];
