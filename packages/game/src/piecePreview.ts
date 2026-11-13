import { tetrominoes, type Mino } from "@haelp/teto/engine";
import type { Block } from "./Game";

export interface PiecePreview {
	width: number;
	height: number;
	blocks: Array<Block>;
}

export const piecePreview = (mino: Mino): PiecePreview => {
	const preview = tetrominoes[mino]?.preview;

	if (!preview) throw new Error(`No preview shape for mino "${mino}"`);

	return { width: preview.w, height: preview.h, blocks: preview.data.map(([x, y]) => [x, y]) };
};
