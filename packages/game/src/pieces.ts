import { Mino, tetrominoes, type Rotation, type TetrominoData } from "@haelp/teto/engine";

export type Block = [x: number, y: number];

export type Piece = Exclude<Mino, Mino.GARBAGE | Mino.BOMB>;

export const BAG: ReadonlyArray<Piece> = [Mino.Z, Mino.L, Mino.O, Mino.S, Mino.I, Mino.J, Mino.T];

export interface Placement {
	readonly mino: Piece;
	readonly rotation: Rotation;
	readonly x: number;
	readonly y: number;
}

export const pieceShape = (mino: Mino): TetrominoData => {
	const shape = tetrominoes[mino];

	if (!shape) throw new Error(`No shape for mino "${mino}"`);

	return shape;
};

export const placementCells = ({ mino, rotation, x, y }: Placement): Array<Block> =>
	(pieceShape(mino).matrix.data[rotation] ?? []).map(([blockX, blockY]) => [x + blockX, y - blockY]);
