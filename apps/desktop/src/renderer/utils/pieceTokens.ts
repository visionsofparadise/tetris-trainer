import { Mino } from "@tetris-trainer/game";

export type PieceToken = { readonly text: string } | { readonly mino: Mino };

const PIECE_LETTER = /(?<![\w-])([IJLOSTZ])(?![\w-])/g;

const MINOS: Partial<Record<string, Mino>> = {
	I: Mino.I,
	J: Mino.J,
	L: Mino.L,
	O: Mino.O,
	S: Mino.S,
	T: Mino.T,
	Z: Mino.Z,
};

const tokenOf = (part: string, index: number): PieceToken => {
	const mino = index % 2 === 1 ? MINOS[part] : undefined;

	return mino === undefined ? { text: part } : { mino };
};

export const pieceTokens = (text: string): Array<PieceToken> =>
	text
		.split(PIECE_LETTER)
		.map(tokenOf)
		.filter((token) => !("text" in token) || token.text !== "");
