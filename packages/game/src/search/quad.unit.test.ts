import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEMO_HANDLING } from "../config";
import { BAG, cellsKey, type Block, type Piece } from "../pieces";
import { emptySimBoard, lockCells, type SimBoard } from "../sim/simBoard";
import { isQuadReady, judgeDistance, readyGap, rowsReady, searchQuadReady, windowFill } from "./quad";
import type { Mover, MoveRules } from "./moves";
import type { SearchBudget, SearchResult } from "./searchState";

const WELL = 9;

const GOAL = { well: WELL };

const FULL = "#########.";

const MOVER: Mover = { handling: DEMO_HANDLING, gravity: 0 };

const BUDGET: SearchBudget = { nodes: 50000, depth: 6, deadlineMs: null };

const RULES: MoveRules = {
	allow180: true,
	excluded: Object.fromEntries(BAG.filter((mino) => mino !== Mino.I).map((mino) => [mino, [WELL]])),
	holeFreeOnly: true,
	ceiling: null,
	quadClearsOnly: true,
};

const boardOf = (rows: ReadonlyArray<string>): SimBoard => {
	const board = emptySimBoard();

	[...rows].reverse().forEach((row, y) => {
		board.rows[y] = [...row].reduce((mask, cell, x) => (cell === "#" ? mask | (1 << x) : mask), 0);
	});

	return board;
};

interface Query {
	readonly board: SimBoard;
	readonly current: Piece;
	readonly queue: ReadonlyArray<Piece>;
	readonly hold?: Piece | null;
	readonly holdEnabled?: boolean;
	readonly holdLocked?: boolean;
	readonly rules?: Partial<MoveRules>;
	readonly budget?: Partial<SearchBudget>;
}

const search = ({
	board,
	current,
	queue,
	hold = null,
	holdEnabled = false,
	holdLocked = false,
	rules,
	budget,
}: Query): SearchResult =>
	searchQuadReady({ board, current, queue, hold, holdEnabled, holdLocked }, GOAL, { ...RULES, ...rules }, MOVER, {
		...BUDGET,
		...budget,
	});

const firstSteps = (result: SearchResult): Array<string> =>
	result.kind === "reached"
		? result.firstSteps.map(({ kind, move }) => `${kind} ${move.placement.mino} ${cellsKey(move.cells)}`).sort()
		: [];

const reached = (locks: number): SearchResult => ({ kind: "reached", locks, firstSteps: [], nodes: 0 });

const EIGHT_GAP = boardOf(["........#.", FULL, FULL, FULL]);

const FOUR_GAP = boardOf(["....#####.", FULL, FULL, FULL]);

const SWAPS: ReadonlyArray<Piece> = [Mino.Z, Mino.S, Mino.Z, Mino.S, Mino.Z];

describe("searchQuadReady", () => {
	it("counts the locks to quad-ready and returns every tied first step", () => {
		const result = search({ board: EIGHT_GAP, current: Mino.I, queue: [Mino.I, Mino.O, Mino.O, Mino.O, Mino.O] });

		expect(result.kind === "reached" && result.locks).toBe(2);
		expect(firstSteps(result)).toEqual(["place i 0,3 1,3 2,3 3,3", "place i 4,3 5,3 6,3 7,3"]);
	});

	it("calls the goal beyond when no route in the horizon reaches it", () => {
		expect(search({ board: EIGHT_GAP, current: Mino.S, queue: SWAPS, holdEnabled: true }).kind).toBe("beyond");
	});

	it("calls the goal beyond when the bound exceeds the depth cap", () => {
		const queue: Array<Piece> = [Mino.I, Mino.O, Mino.O, Mino.O, Mino.O];

		expect(search({ board: EIGHT_GAP, current: Mino.I, queue, budget: { depth: 1 } }).kind).toBe("beyond");
	});

	it("returns unknown when the node budget runs out", () => {
		const queue: Array<Piece> = [Mino.I, Mino.O, Mino.O, Mino.O, Mino.O];

		expect(search({ board: EIGHT_GAP, current: Mino.I, queue, budget: { nodes: 1 } })).toEqual({
			kind: "unknown",
			nodes: 1,
		});
	});

	it("returns unknown when the deadline has passed", () => {
		const queue: Array<Piece> = [Mino.I, Mino.O, Mino.O, Mino.O, Mino.O];

		expect(search({ board: EIGHT_GAP, current: Mino.I, queue, budget: { deadlineMs: -1 } })).toEqual({
			kind: "unknown",
			nodes: 0,
		});
	});

	it("reaches the goal through hold, from a held piece or from the next preview", () => {
		const fromHold = search({ board: FOUR_GAP, current: Mino.S, queue: SWAPS, hold: Mino.I, holdEnabled: true });
		const fromPreview = search({
			board: FOUR_GAP,
			current: Mino.S,
			queue: [Mino.I, ...SWAPS.slice(1)],
			holdEnabled: true,
		});

		expect(fromHold.kind === "reached" && fromHold.locks).toBe(1);
		expect(firstSteps(fromHold)).toEqual(["hold i 0,3 1,3 2,3 3,3"]);
		expect(firstSteps(fromPreview)).toEqual(["hold i 0,3 1,3 2,3 3,3"]);
	});

	it("leaves hold out of the first step while the hold is locked", () => {
		const result = search({
			board: FOUR_GAP,
			current: Mino.S,
			queue: SWAPS,
			hold: Mino.I,
			holdEnabled: true,
			holdLocked: true,
		});

		expect(result.kind === "reached" && result.locks).toBe(3);
		expect(firstSteps(result).every((step) => step.startsWith("place s"))).toBe(true);
	});

	it("counts a four-line I clear outside the well as an ordinary lock", () => {
		const board = boardOf([".#########", ".#########", ".#########", ".#########"]);

		expect(search({ board, current: Mino.I, queue: [Mino.O, Mino.O, Mino.O, Mino.O, Mino.O] }).kind).toBe("beyond");
	});

	it("measures the window from above a covered garbage hole in the well column", () => {
		const board = boardOf(["....#####.", FULL, FULL, FULL, "####.#####", FULL]);
		const result = search({ board, current: Mino.I, queue: SWAPS });

		expect(readyGap(board, GOAL)).toBe(4);
		expect(result.kind === "reached" && result.locks).toBe(1);
		expect(firstSteps(result)).toEqual(["place i 0,5 1,5 2,5 3,5"]);
	});

	it("never takes a three-line I in the well as a step, under either clear rule", () => {
		const board = boardOf([FULL, FULL, FULL, FULL, FULL, FULL, FULL, "#........."]);
		const queue: Array<Piece> = [Mino.I, Mino.I, Mino.I, Mino.I, Mino.I];

		for (const quadClearsOnly of [true, false]) {
			const result = search({ board, current: Mino.I, queue, rules: { quadClearsOnly } });

			expect(result.kind === "reached" && result.locks).toBe(2);
			expect(firstSteps(result)).toEqual(["place i 1,0 2,0 3,0 4,0"]);
		}
	});

	it("leaves out the shorter route a rule forbids", () => {
		const board = boardOf(["######....", FULL, FULL, FULL]);
		const open = search({ board, current: Mino.T, queue: SWAPS });
		const wrongSide = search({
			board,
			current: Mino.T,
			queue: SWAPS,
			rules: { excluded: { ...RULES.excluded, [Mino.T]: [6, 7, 8, WELL] } },
		});

		expect(open.kind === "reached" && open.locks).toBe(1);
		expect(wrongSide.kind === "reached" && wrongSide.locks).toBe(3);
		expect(firstSteps(wrongSide).every((step) => step.startsWith("place t") && !/[6-9],3/.test(step))).toBe(true);
	});

	it("takes any lock on a ready board, the quad included", () => {
		const board = boardOf([FULL, FULL, FULL, FULL]);
		const result = search({ board, current: Mino.I, queue: SWAPS });

		expect(result.kind === "reached" && result.locks).toBe(1);
		expect(firstSteps(result)).toContain("place i 9,0 9,1 9,2 9,3");
	});
});

const cellsOf = (...cells: Array<Block>): Array<Block> => cells;

const WELL_I = cellsOf([9, 0], [9, 1], [9, 2], [9, 3]);

describe("isQuadReady", () => {
	it("holds when the lock fills the window, or an I in the well clears four lines", () => {
		const board = boardOf(["#####...#.", FULL, FULL, FULL]);
		const filling = cellsOf([5, 3], [6, 3], [7, 3], [6, 4]);
		const short = cellsOf([5, 3], [6, 3], [5, 4], [6, 4]);

		expect(isQuadReady(lockCells(board, filling, "none"), filling, GOAL)).toBe(true);
		expect(isQuadReady(lockCells(board, short, "none"), short, GOAL)).toBe(false);
		expect(isQuadReady(lockCells(boardOf([FULL, FULL, FULL, FULL]), WELL_I, "none"), WELL_I, GOAL)).toBe(true);
	});

	it("leaves out a four-line I clear outside the goal's well", () => {
		const columnZero = boardOf([".#########", ".#########", ".#########", ".#########"]);
		const zeroI = cellsOf([0, 0], [0, 1], [0, 2], [0, 3]);
		const convert = lockCells(boardOf([FULL, FULL, FULL, FULL]), WELL_I, "none");

		expect(isQuadReady(lockCells(columnZero, zeroI, "none"), zeroI, GOAL)).toBe(false);
		expect(isQuadReady(convert, WELL_I, { well: 6 })).toBe(false);
	});
});

describe("rowsReady", () => {
	it("counts complete rows up from the well floor and stops at the first gap", () => {
		expect(rowsReady(boardOf(["####......", FULL, "#####.###.", FULL]), GOAL)).toBe(1);
		expect(rowsReady(boardOf([FULL, FULL, FULL, FULL, FULL]), GOAL)).toBe(4);
		expect(rowsReady(boardOf(["##########", FULL, FULL]), GOAL)).toBe(0);
	});
});

describe("windowFill", () => {
	it("counts the filled non-well cells in the four rows above the well floor", () => {
		expect(windowFill(boardOf(["#####.....", "##########", FULL]), GOAL)).toBe(5);
		expect(windowFill(boardOf(["####......", FULL, "#####.###."]), GOAL)).toBe(21);
	});
});

describe("judgeDistance", () => {
	it.each([
		["before beyond", { kind: "beyond", nodes: 0 }, reached(1), false, "silent"],
		["before unknown", { kind: "unknown", nodes: 0 }, reached(1), false, "silent"],
		["after unknown", reached(3), { kind: "unknown", nodes: 0 }, false, "silent"],
		["the lock reached the goal", reached(1), reached(1), true, "pass"],
		["one lock closer", reached(3), reached(2), false, "pass"],
		["more than one lock closer", reached(3), reached(1), false, "pass"],
		["no closer", reached(3), reached(3), false, "fail"],
		["after beyond", reached(3), { kind: "beyond", nodes: 0 }, false, "fail"],
	] as const)("%s", (_, before, after, reachedOnLock, call) => {
		expect(judgeDistance(before, after, reachedOnLock)).toBe(call);
	});
});
