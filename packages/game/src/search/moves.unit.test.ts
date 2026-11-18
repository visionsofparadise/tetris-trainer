import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, DEMO_HANDLING } from "../config";
import { BAG, cellsKey, type Piece } from "../pieces";
import { emptySimBoard, isHoleFree, lockCells, type SimBoard } from "../sim/simBoard";
import { generateMoves, type Move, type Mover, type MoveRules } from "./moves";

const RULES: MoveRules = {
	allow180: true,
	excluded: {},
	holeFreeOnly: false,
	ceiling: null,
	quadClearsOnly: false,
	deadRows: 0,
};

const MOVER: Mover = { handling: DEMO_HANDLING, gravity: 0 };

const boardOf = (rows: ReadonlyArray<string>): SimBoard => {
	const board = emptySimBoard();

	[...rows].reverse().forEach((row, y) => {
		board.rows[y] = [...row].reduce((mask, cell, x) => (cell === "#" ? mask | (1 << x) : mask), 0);
	});

	return board;
};

const moves = (board: SimBoard, mino: Piece, rules: Partial<MoveRules> = {}, mover = MOVER): Array<Move> =>
	generateMoves(board, mino, { ...RULES, ...rules }, mover);

const linesOf = (board: SimBoard, move: Move): number => lockCells(board, move.cells, move.spin).lines;

const at = (found: ReadonlyArray<Move>, cells: string): Array<Move> =>
	found.filter((move) => cellsKey(move.cells) === cells);

describe("generateMoves", () => {
	it("finds every distinct floor placement on an empty board", () => {
		const counts = Object.fromEntries(BAG.map((mino) => [mino, moves(emptySimBoard(), mino).length]));

		expect(counts).toEqual({
			[Mino.O]: 9,
			[Mino.I]: 17,
			[Mino.S]: 17,
			[Mino.Z]: 17,
			[Mino.T]: 34,
			[Mino.J]: 34,
			[Mino.L]: 34,
		});
	});

	it("tucks a piece under an overhang after a soft drop", () => {
		const board = boardOf(["####......", ".........."]);
		const [tuck] = at(moves(board, Mino.I), "0,0 1,0 2,0 3,0");

		expect(tuck?.keys).toEqual([
			{ tap: "moveRight" },
			{ hold: "softDrop", frames: 1 },
			{ das: "moveLeft" },
			{ tap: "hardDrop" },
		]);
		expect(tuck?.presses).toBe(3);
	});

	it("reaches a TSD with a full spin by turning, dropping and turning", () => {
		const board = boardOf(["####......", "###...####", "####.#####"]);
		const [tsd] = at(moves(board, Mino.T), "3,1 4,0 4,1 5,1");

		expect(tsd).toMatchObject({
			spin: "normal",
			keys: [{ tap: "rotateCW" }, { hold: "softDrop", frames: 1 }, { tap: "rotateCW" }, { tap: "hardDrop" }],
		});
		expect(tsd && linesOf(board, tsd)).toBe(2);
	});

	it("keeps the same cells as separate moves when a drop and a turn score different spins", () => {
		const board = boardOf([".#........"]);
		const spins = at(moves(board, Mino.T), "0,0 0,1 0,2 1,1").map((move) => move.spin);

		expect(spins.sort()).toEqual(["mini", "none"]);
	});

	it("kicks a T into a TST slot under an overhang", () => {
		const board = boardOf(["....######", ".....#####", "####.#####", "###..#####", "####.#####"]);
		const [tst] = at(moves(board, Mino.T), "3,1 4,0 4,1 4,2");

		expect(tst?.spin).toBe("normal");
		expect(tst?.keys.at(-2)).toEqual({ tap: "rotateCCW" });
		expect(tst && linesOf(board, tst)).toBe(3);
	});

	it("leaves out 180 turns unless the rules allow them", () => {
		const turns = (allow180: boolean): boolean =>
			moves(emptySimBoard(), Mino.T, { allow180 }).some((move) =>
				move.keys.some((step) => "tap" in step && step.tap === "rotate180"),
			);

		expect([turns(true), turns(false)]).toEqual([true, false]);
	});

	it("keeps each piece out of its excluded columns only", () => {
		const excluded = { [Mino.T]: [9] };

		expect(moves(emptySimBoard(), Mino.T, { excluded }).some((move) => move.cells.some(([x]) => x === 9))).toBe(
			false,
		);
		expect(moves(emptySimBoard(), Mino.I, { excluded }).some((move) => move.cells.some(([x]) => x === 9))).toBe(true);
	});

	it("drops locks that cover an empty cell when only hole-free moves are allowed", () => {
		const board = boardOf(["#.#.#.....", "###.##...."]);
		const all = moves(board, Mino.L);
		const clean = moves(board, Mino.L, { holeFreeOnly: true });

		expect(clean.every((move) => isHoleFree(board, move.cells))).toBe(true);
		expect(clean.length).toBe(all.filter((move) => isHoleFree(board, move.cells)).length);
		expect(clean.length).toBeLessThan(all.length);
	});

	it("keeps locks that cover an empty cell only in the dead rows", () => {
		const board = boardOf(["##.#......"]);
		const covers = (found: ReadonlyArray<Move>): boolean =>
			found.some((move) => move.cells.some(([x, y]) => x === 2 && y === 1));

		expect(covers(moves(board, Mino.O, { holeFreeOnly: true }))).toBe(false);
		expect(covers(moves(board, Mino.O, { holeFreeOnly: true, deadRows: 1 }))).toBe(true);
	});

	it("drops locks with a cell at or above the ceiling", () => {
		const board = boardOf(["#.........", "##.......#"]);
		const capped = moves(board, Mino.J, { ceiling: 3 });

		expect(capped.every((move) => move.cells.every(([, y]) => y < 3))).toBe(true);
		expect(capped.length).toBeLessThan(moves(board, Mino.J).length);
	});

	it("bars one- to three-line clears and keeps quads when only quad clears are allowed", () => {
		const board = boardOf(["#########.", "#########.", "#########.", "#########."]);
		const lines = (mino: Piece, quadClearsOnly: boolean): Array<number> =>
			moves(board, mino, { quadClearsOnly }).map((move) => linesOf(board, move));

		expect(lines(Mino.T, false)).toContain(1);
		expect(lines(Mino.T, true).every((count) => count === 0)).toBe(true);
		expect(lines(Mino.I, true)).toContain(4);
	});

	it("holds the soft drop long enough for the mover's soft-drop speed", () => {
		const [drop] = at(
			moves(boardOf(["####......", ".........."]), Mino.I, {}, { handling: DEFAULT_CONFIG.handling, gravity: 0.02 }),
			"0,0 1,0 2,0 3,0",
		);

		expect(drop?.keys[1]).toEqual({ hold: "softDrop", frames: 68 });
	});
});
