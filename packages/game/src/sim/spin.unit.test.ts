import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { emptySimBoard, type SimBoard } from "./simBoard";
import { isTstKick, rotationSpin } from "./spin";

const boardOf = (rows: ReadonlyArray<string>): SimBoard => {
	const board = emptySimBoard();

	[...rows].reverse().forEach((row, y) => {
		board.rows[y] = [...row].reduce((mask, cell, x) => (cell === "#" ? mask | (1 << x) : mask), 0);
	});

	return board;
};

const RIGHT = 1;

const REVERSE = 2;

describe("rotationSpin", () => {
	const tsd = boardOf(["####......", "###...####", "####.#####"]);

	it("scores a T with both front corners and a third corner filled as a full spin", () => {
		expect(rotationSpin(tsd, Mino.T, REVERSE, 3, 2, false)).toBe("normal");
	});

	it("scores a T with three corners but one front corner as a mini", () => {
		const board = boardOf(["...#.#....", "##....####", "###..#####"]);

		expect(rotationSpin(board, Mino.T, REVERSE, 3, 2, false)).toBe("mini");
	});

	it("raises a mini to a full spin after a TST or fin kick", () => {
		const board = boardOf(["...#.#....", "##....####", "###..#####"]);

		expect(rotationSpin(board, Mino.T, REVERSE, 3, 2, true)).toBe("normal");
	});

	it("scores no T spin while the T can still fall", () => {
		const board = boardOf(["...#.#....", "..........", "...#......", "..........", ".........."]);

		expect(rotationSpin(board, Mino.T, RIGHT, 3, 4, false)).toBe("none");
	});

	it("scores any piece that cannot move in any direction as a mini", () => {
		const board = boardOf(["#.########", "#..#######", "##.#######"]);

		expect(rotationSpin(board, Mino.S, RIGHT, 0, 2, false)).toBe("mini");
		expect(rotationSpin(boardOf(["##########"]), Mino.S, RIGHT, 0, 3, false)).toBe("none");
	});

	it("scores an immobile T with fewer than three corners as a mini", () => {
		const board = boardOf(["..#.......", "#...######", "##.#######"]);

		expect(rotationSpin(board, Mino.T, REVERSE, 1, 2, false)).toBe("mini");
	});
});

describe("isTstKick", () => {
	it("matches the last kick of a quarter turn into a vertical T", () => {
		expect([isTstKick(0, 3, [1, -2]), isTstKick(2, 3, [1, -2]), isTstKick(0, 1, [-1, -2])]).toEqual([
			true,
			true,
			true,
		]);
		expect([isTstKick(0, 3, [-1, -2]), isTstKick(1, 2, [1, -2])]).toEqual([false, false]);
	});
});
