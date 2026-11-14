import { pieceShape, type Block } from "./pieces";
import type { Mino } from "@haelp/teto/engine";

export interface PiecePreview {
	width: number;
	height: number;
	blocks: Array<Block>;
}

export const piecePreview = (mino: Mino): PiecePreview => {
	const { preview } = pieceShape(mino);

	return { width: preview.w, height: preview.h, blocks: preview.data.map(([x, y]) => [x, y]) };
};
