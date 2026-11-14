import { Mino, tetrominoes, type TetrominoData } from "@haelp/teto/engine";

export type Block = [x: number, y: number];

export type Piece = Exclude<Mino, Mino.GARBAGE | Mino.BOMB>;

export const BAG: ReadonlyArray<Piece> = [Mino.Z, Mino.L, Mino.O, Mino.S, Mino.I, Mino.J, Mino.T];

export const ORIENTATIONS = ["spawn", "right", "reverse", "left"] as const;

export type Orientation = (typeof ORIENTATIONS)[number];

export interface Placement {
	readonly mino: Piece;
	readonly orientation: Orientation;
	readonly column: number;
	readonly row: number;
}

export const pieceShape = (mino: Mino): TetrominoData => {
	const shape = tetrominoes[mino];

	if (!shape) throw new Error(`No shape for mino "${mino}"`);

	return shape;
};

export const boxBlocks = (mino: Mino, rotation: number): Array<Block> =>
	(pieceShape(mino).matrix.data[rotation % ORIENTATIONS.length] ?? []).map(([x, y]) => [x, -y]);

export const leftmost = (blocks: ReadonlyArray<Block>): number => Math.min(...blocks.map(([x]) => x));

export const lowest = (blocks: ReadonlyArray<Block>): number => Math.min(...blocks.map(([, y]) => y));

export const placementCells = ({ mino, orientation, column, row }: Placement): Array<Block> => {
	const blocks = boxBlocks(mino, ORIENTATIONS.indexOf(orientation));
	const left = leftmost(blocks);
	const bottom = lowest(blocks);

	return blocks.map(([x, y]) => [column + x - left, row + y - bottom]);
};

const cellsKey = (cells: ReadonlyArray<Block>): string =>
	cells
		.map(([x, y]) => `${x},${y}`)
		.sort()
		.join(" ");

export const samePlacement = (first: Placement, second: Placement): boolean =>
	first.mino === second.mino && cellsKey(placementCells(first)) === cellsKey(placementCells(second));
