import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { fits, pieceShapes, spawnColumn } from "./shapes";
import { emptySimBoard, isHoleFree, lockCells, simBoardOf, type SimBoard } from "./simBoard";
import type { Block, Piece } from "../pieces";

const FULL = 0b1111111111;

const boardOf = (rows: ReadonlyArray<string>): SimBoard => {
	const board = emptySimBoard();

	[...rows].reverse().forEach((row, y) => {
		board.rows[y] = [...row].reduce((mask, cell, x) => (cell === "#" ? mask | (1 << x) : mask), 0);
	});

	return board;
};

const sorted = (cells: ReadonlyArray<Block>): Array<Block> =>
	[...cells].sort(([firstX, firstY], [secondX, secondY]) => firstY - secondY || firstX - secondX);

describe("pieceShapes", () => {
	it("gives each rotation's cells from the box's top-left corner, y up", () => {
		const [spawn, right, reverse, left] = pieceShapes(Mino.T);

		expect(sorted(spawn?.cells ?? [])).toEqual([
			[0, -1],
			[1, -1],
			[2, -1],
			[1, 0],
		]);
		expect(sorted(right?.cells ?? [])).toEqual([
			[1, -2],
			[1, -1],
			[2, -1],
			[1, 0],
		]);
		expect(sorted(reverse?.cells ?? [])).toEqual([
			[1, -2],
			[0, -1],
			[1, -1],
			[2, -1],
		]);
		expect(sorted(left?.cells ?? [])).toEqual([
			[1, -2],
			[0, -1],
			[1, -1],
			[1, 0],
		]);
	});

	it("keeps the I's vertical column inside its box", () => {
		expect(sorted(pieceShapes(Mino.I)[1]?.cells ?? [])).toEqual([
			[2, -3],
			[2, -2],
			[2, -1],
			[2, 0],
		]);
	});

	it("spawns the O one column right of the others", () => {
		const pieces: Array<Piece> = [Mino.O, Mino.I, Mino.T];

		expect(pieces.map(spawnColumn)).toEqual([4, 3, 3]);
	});
});

describe("fits", () => {
	const board = boardOf(["#.........", "##........"]);
	const flatT = pieceShapes(Mino.T)[0];

	it("rejects walls, the floor and filled cells, and accepts free space", () => {
		if (!flatT) throw new Error("No T shape");

		expect(fits(board, flatT, 2, 1)).toBe(true);
		expect(fits(board, flatT, 0, 2)).toBe(false);
		expect(fits(board, flatT, -1, 5)).toBe(false);
		expect(fits(board, flatT, 8, 5)).toBe(false);
		expect(fits(board, flatT, 4, 0)).toBe(false);
	});
});

describe("simBoardOf", () => {
	it("sets bit x of row y for each filled cell", () => {
		const board = simBoardOf([
			[Mino.Z, null, Mino.GARBAGE],
			[null, Mino.I],
		]);

		expect([board.rows[0], board.rows[1], board.rows.length]).toEqual([0b101, 0b10, 40]);
	});
});

describe("lockCells", () => {
	it("adds the cells, then clears every full row and drops the rows above", () => {
		const board = boardOf(["....#.....", "#########.", ".#........", "#########."]);
		const lock = lockCells(
			board,
			[
				[9, 0],
				[9, 1],
				[9, 2],
				[9, 3],
			],
			"none",
		);

		expect(Array.from(lock.added.rows.slice(0, 4))).toEqual([FULL, 0b1000000010, FULL, 0b1000010000]);
		expect(Array.from(lock.board.rows.slice(0, 3))).toEqual([0b1000000010, 0b1000010000, 0]);
		expect(lock.lines).toBe(2);
	});

	it("reports the spin it was given and leaves the board it was given unchanged", () => {
		const board = boardOf(["#########."]);
		const lock = lockCells(board, [[9, 0]], "mini");

		expect([lock.spin, lock.lines, board.rows[0]]).toEqual(["mini", 1, 0b111111111]);
	});
});

describe("isHoleFree", () => {
	const board = boardOf(["##........", "##........"]);

	it("accepts cells resting on the floor, the stack or each other", () => {
		expect(
			isHoleFree(board, [
				[1, 2],
				[2, 0],
				[2, 1],
				[2, 2],
			]),
		).toBe(true);
	});

	it("rejects a cell over an empty cell outside the set", () => {
		expect(
			isHoleFree(board, [
				[2, 2],
				[3, 2],
				[4, 2],
				[3, 1],
			]),
		).toBe(false);
	});
});
