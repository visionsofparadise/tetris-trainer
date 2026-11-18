import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEMO_HANDLING } from "../config";
import { BAG, cellsKey } from "../pieces";
import { emptySimBoard, type SimBoard } from "../sim/simBoard";
import { fitAfter, homeless } from "./fit";
import type { Mover, MoveRules } from "./moves";

const WELL = 6;

const THREE_SIDE = [7, 8, 9];

const MOVER: Mover = { handling: DEMO_HANDLING, gravity: 0 };

const RULES: MoveRules = {
	allow180: true,
	excluded: {
		...Object.fromEntries(BAG.map((mino) => [mino, [WELL]])),
		[Mino.I]: [WELL, ...THREE_SIDE],
		[Mino.T]: [WELL, ...THREE_SIDE],
	},
	holeFreeOnly: true,
	ceiling: null,
	quadClearsOnly: true,
	deadRows: 0,
};

const boardOfHeights = (heights: ReadonlyArray<number>): SimBoard => {
	const board = emptySimBoard();

	heights.forEach((height, x) => {
		for (let y = 0; y < height; y++) board.rows[y] = (board.rows[y] ?? 0) | (1 << x);
	});

	return board;
};

const BOARD = boardOfHeights([0, 8, 10, 8, 10, 8, 0, 0, 0, 0]);

describe("homeless", () => {
	it("lists the pieces with no hole-free move under the lesson's columns", () => {
		expect(homeless(BOARD, BAG, RULES)).toEqual([Mino.Z, Mino.S, Mino.T]);
		expect(homeless(BOARD, BAG, { ...RULES, excluded: {} })).toEqual([Mino.Z, Mino.S]);
	});
});

describe("fitAfter", () => {
	it("returns the homeless pieces after each move", () => {
		const after = Object.fromEntries(
			fitAfter(BOARD, Mino.J, BAG, RULES, MOVER).map(({ move, homeless: pieces }) => [cellsKey(move.cells), pieces]),
		);

		expect(Object.keys(after)).toHaveLength(5);
		expect(after["7,0 7,1 8,0 9,0"]).toEqual([Mino.T]);
		expect(after["8,0 9,0 9,1 9,2"]).toEqual([Mino.O, Mino.S, Mino.T]);
	});

	it("keeps an excluded piece off its excluded columns", () => {
		const columns = fitAfter(BOARD, Mino.I, BAG, RULES, MOVER).flatMap(({ move }) => move.cells.map(([x]) => x));

		expect(columns.every((x) => x < WELL)).toBe(true);
	});
});
