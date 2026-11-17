import { DEMO_HANDLING } from "../config";
import { lockCells, type SimBoard } from "../sim/simBoard";
import { generateMoves, type Move, type Mover, type MoveRules } from "./moves";
import type { Piece } from "../pieces";

export interface FitResult {
	readonly move: Move;
	readonly homeless: ReadonlyArray<Piece>;
}

const FIT_MOVER: Mover = { handling: DEMO_HANDLING, gravity: 0 };

export const homeless = (board: SimBoard, pieces: ReadonlyArray<Piece>, rules: MoveRules): Array<Piece> => {
	const fitRules: MoveRules = { ...rules, holeFreeOnly: true };

	return pieces.filter((mino) => generateMoves(board, mino, fitRules, FIT_MOVER).length === 0);
};

export const fitAfter = (
	board: SimBoard,
	mino: Piece,
	pieces: ReadonlyArray<Piece>,
	rules: MoveRules,
	mover: Mover,
): Array<FitResult> =>
	generateMoves(board, mino, rules, mover).map((move) => ({
		move,
		homeless: homeless(lockCells(board, move.cells, move.spin).board, pieces, rules),
	}));
