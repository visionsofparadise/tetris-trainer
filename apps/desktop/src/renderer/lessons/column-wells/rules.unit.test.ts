import { Mino, simBoardOf, type Block, type SimBoard } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { isWellMove } from "./rules";
import { wellStage } from "./stages";

const NINE_ZERO = wellStage("nine-zero");

const boardOf = (rows: ReadonlyArray<string>): SimBoard =>
	simBoardOf([...rows].reverse().map((row) => [...row].map((cell) => (cell === "#" ? Mino.GARBAGE : null))));

const WELL_I: ReadonlyArray<Block> = [
	[9, 0],
	[9, 1],
	[9, 2],
	[9, 3],
];

describe("isWellMove", () => {
	const flat = boardOf([]);

	it("calls an I in the well a well move only when it clears nothing", () => {
		expect(isWellMove(Mino.I, WELL_I, 0, NINE_ZERO, flat)).toBe(true);
		expect(isWellMove(Mino.I, WELL_I, 2, NINE_ZERO, flat)).toBe(false);
		expect(isWellMove(Mino.I, WELL_I, 4, NINE_ZERO, flat)).toBe(false);
	});

	it("calls any other piece in the well a well move, except on rows that already hold a covered cell", () => {
		const forced = boardOf([".##.......", "##.#......"]);
		const raise: ReadonlyArray<Block> = [
			[7, 1],
			[7, 0],
			[8, 0],
			[9, 0],
		];
		const tall: ReadonlyArray<Block> = [
			[8, 0],
			[9, 0],
			[8, 1],
			[9, 1],
		];

		expect(isWellMove(Mino.J, raise, 0, NINE_ZERO, flat)).toBe(true);
		expect(isWellMove(Mino.J, raise, 0, NINE_ZERO, forced)).toBe(false);
		expect(isWellMove(Mino.O, tall, 0, NINE_ZERO, forced)).toBe(true);
	});
});
