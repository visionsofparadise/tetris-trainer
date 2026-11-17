import { describe, expect, it } from "vitest";
import { BAG } from "../pieces";
import { generateMoves } from "../search/moves";
import {
	chunks,
	HOLE_BOARDS,
	loadBoard,
	MOVERS,
	OPEN_RULES,
	playMove,
	SPIN_BOARDS,
	STACK_BOARDS,
} from "../search/plays";
import { lockCells } from "./simBoard";

const BOARDS = [...STACK_BOARDS, ...HOLE_BOARDS, ...SPIN_BOARDS];

describe("lockCells against the game", () => {
	describe.each(BAG)("%s", (mino) => {
		describe.each(MOVERS)("with %s", (_, mover) => {
			it.each(chunks(BOARDS, 25).map((boards, index) => [index + 1, boards] as const))(
				"leaves the game's board after each move on chunk %i",
				(_, boards) => {
					const wrong = boards.flatMap(({ name, board }) => {
						const { game, start } = loadBoard(board, mino, mover);

						return generateMoves(board, mino, OPEN_RULES, mover).flatMap((move) => {
							const played = playMove(game, start, move).board;
							const locked = lockCells(board, move.cells, move.spin).board;

							return played.rows.every((row, y) => row === locked.rows[y])
								? []
								: [`${name}: ${JSON.stringify(move.placement)}`];
						});
					});

					expect(wrong).toEqual([]);
				},
			);
		});
	});
});
