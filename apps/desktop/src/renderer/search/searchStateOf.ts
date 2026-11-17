import { isPiece, simBoardOf, type Game, type Mino, type Piece, type SearchState } from "@tetris-trainer/game";

const pieceOf = (mino: Mino): Piece => {
	if (!isPiece(mino)) throw new Error(`The search reads tetrominoes only, not ${mino}`);

	return mino;
};

export const searchStateOf = (game: Game): SearchState => {
	const { hold } = game;

	return {
		board: simBoardOf(game.board),
		current: pieceOf(game.falling.mino),
		hold: hold === null ? null : pieceOf(hold),
		holdEnabled: game.isHoldEnabled,
		queue: game.next.map(pieceOf),
	};
};
