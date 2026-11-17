import { Mino, RNG } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../config";
import { BOARD_COLUMNS } from "../engineOptions";
import { BAG, cellsKey, type Block, type Piece } from "../pieces";
import { BOARD_ROWS, emptySimBoard, FULL_ROW, lockCells, type SimBoard } from "../sim/simBoard";
import { spreadBoards } from "./boardSpread";
import { generateMoves, type Mover, type MoveRules } from "./moves";
import { searchQuadReady } from "./quad";
import type { SearchResult, SearchState } from "./searchState";

const WELL = 9;

const FULL = "#########.";

const MOVER: Mover = { handling: DEFAULT_CONFIG.handling, gravity: 0.02 };

const WELL_RULES: MoveRules = {
	allow180: true,
	excluded: Object.fromEntries(BAG.filter((mino) => mino !== Mino.I).map((mino) => [mino, [WELL]])),
	holeFreeOnly: true,
	ceiling: null,
	quadClearsOnly: true,
};

const CLEAR_RULES: MoveRules = { ...WELL_RULES, quadClearsOnly: false };

const OPEN_RULES: MoveRules = { ...WELL_RULES, holeFreeOnly: false, quadClearsOnly: false };

interface OracleState {
	readonly board: SimBoard;
	readonly current: Piece | undefined;
	readonly hold: Piece | null | "unseen";
	readonly queue: ReadonlyArray<Piece>;
	readonly holdEnabled: boolean;
	readonly holdLocked: boolean;
}

interface OracleStep {
	readonly kind: "place" | "hold";
	readonly piece: Piece;
	readonly after: (board: SimBoard) => OracleState;
}

const filled = (rows: ReadonlyArray<number>, x: number, y: number): boolean => (((rows[y] ?? 0) >> x) & 1) === 1;

const rowsWith = (board: SimBoard, cells: ReadonlyArray<Block>): Array<number> => {
	const rows = Array.from(board.rows);

	for (const [x, y] of cells) rows[y] = (rows[y] ?? 0) | (1 << x);

	return rows;
};

const fullRows = (rows: ReadonlyArray<number>): number =>
	rows.filter((_, y) => Array.from({ length: BOARD_COLUMNS }, (_unused, x) => filled(rows, x, y)).every(Boolean))
		.length;

const isWellQuad = (rows: ReadonlyArray<number>, cells: ReadonlyArray<Block>): boolean =>
	fullRows(rows) === 4 && cells.some(([x]) => x === WELL);

const isOracleGoal = (board: SimBoard, cells: ReadonlyArray<Block>): boolean => {
	const rows = rowsWith(board, cells);

	if (isWellQuad(rows, cells)) return true;

	let floor = 0;

	for (let y = 0; y < BOARD_ROWS; y++) if (filled(rows, WELL, y)) floor = y + 1;

	return [floor, floor + 1, floor + 2, floor + 3].every((y) =>
		Array.from({ length: BOARD_COLUMNS }, (_, x) => x).every((x) => x === WELL || filled(rows, x, y)),
	);
};

const oracleSteps = (state: OracleState): Array<OracleStep> => {
	const { current, hold, queue } = state;
	const [first, second, ...rest] = queue;
	const steps: Array<OracleStep> = [];
	const next = (board: SimBoard, held: OracleState["hold"], upcoming: ReadonlyArray<Piece>): OracleState => ({
		...state,
		board,
		current: upcoming[0],
		hold: held,
		queue: upcoming.slice(1),
		holdLocked: false,
	});

	if (current !== undefined) steps.push({ kind: "place", piece: current, after: (board) => next(board, hold, queue) });

	if (!state.holdEnabled || state.holdLocked) return steps;

	if (hold === null && current !== undefined && first !== undefined)
		steps.push({
			kind: "hold",
			piece: first,
			after: (board) => next(board, current, second === undefined ? [] : [second, ...rest]),
		});

	if (hold !== null && hold !== "unseen" && hold !== current)
		steps.push({ kind: "hold", piece: hold, after: (board) => next(board, current ?? "unseen", queue) });

	return steps;
};

interface OracleMove {
	readonly step: OracleStep;
	readonly key: string;
	readonly goal: boolean;
	readonly board: SimBoard;
}

const oracleMoves = (state: OracleState, rules: MoveRules): Array<OracleMove> =>
	oracleSteps(state).flatMap((step) =>
		generateMoves(state.board, step.piece, rules, MOVER)
			.filter(
				(move) =>
					move.cells.every(([x]) => x !== WELL) || isWellQuad(rowsWith(state.board, move.cells), move.cells),
			)
			.map((move) => ({
				step,
				key: `${step.kind} ${cellsKey(move.cells)} ${move.spin}`,
				goal: isOracleGoal(state.board, move.cells),
				board: lockCells(state.board, move.cells, move.spin).board,
			})),
	);

const oracleReaches = (state: OracleState, rules: MoveRules, locks: number): boolean =>
	oracleMoves(state, rules).some(
		(move) => move.goal || (locks > 1 && oracleReaches(move.step.after(move.board), rules, locks - 1)),
	);

const oracleFirstSteps = (state: OracleState, rules: MoveRules, locks: number): Array<string> =>
	oracleMoves(state, rules)
		.filter((move) => move.goal || (locks > 1 && oracleReaches(move.step.after(move.board), rules, locks - 1)))
		.map((move) => move.key)
		.sort();

const oracleStateOf = ({ board, current, hold, holdEnabled, holdLocked, queue }: SearchState): OracleState => ({
	board,
	current,
	hold,
	queue,
	holdEnabled,
	holdLocked,
});

const searchedSteps = (result: SearchResult): Array<string> =>
	result.kind === "reached"
		? result.firstSteps.map(({ kind, move }) => `${kind} ${cellsKey(move.cells)} ${move.spin}`).sort()
		: [];

const queueOf = (seed: number): Array<Piece> => {
	const rng = new RNG(seed);
	const offset = Math.floor(rng.nextFloat() * BAG.length);
	const pieces: Array<Piece> = [];

	while (pieces.length < offset + 6) pieces.push(...rng.shuffleArray([...BAG]));

	return pieces.slice(offset, offset + 6);
};

const stateOf = (board: SimBoard, seed: number, holdEnabled: boolean): SearchState => {
	const [current = Mino.T, ...queue] = queueOf(seed);
	const hold = holdEnabled && seed % 2 === 0 ? (BAG[seed % BAG.length] ?? null) : null;

	return { board, current, hold, holdEnabled, holdLocked: holdEnabled && seed % 3 === 0, queue };
};

const crossCheck = (state: SearchState, depth: number, rules = WELL_RULES): SearchResult => {
	const result = searchQuadReady(state, { well: WELL }, rules, MOVER, { nodes: 1_000_000, depth, deadlineMs: null });
	const oracle = oracleStateOf(state);
	const locks = Array.from({ length: depth }, (_, index) => index + 1).find((count) =>
		oracleReaches(oracle, rules, count),
	);

	expect(result.kind).toBe(locks === undefined ? "beyond" : "reached");
	expect(result.kind === "reached" ? result.locks : undefined).toBe(locks);
	expect(searchedSteps(result)).toEqual(locks === undefined ? [] : oracleFirstSteps(oracle, rules, locks));

	return result;
};

const boardOf = (rows: ReadonlyArray<string>): SimBoard => {
	const board = emptySimBoard();

	[...rows].reverse().forEach((row, y) => {
		board.rows[y] = [...row].reduce((mask, cell, x) => (cell === "#" ? mask | (1 << x) : mask), 0);
	});

	return board;
};

const raised = (board: SimBoard, garbage: number, hole: number): SimBoard => {
	const open = FULL_ROW & ~(1 << hole);
	const rows = new Uint16Array(BOARD_ROWS);

	rows.fill(open, 0, garbage);
	rows.set(board.rows.subarray(0, BOARD_ROWS - garbage), garbage);

	return { rows };
};

const SPREAD = spreadBoards(1, 50, WELL);

const STACK_COLUMNS = Array.from({ length: WELL }, (_, x) => x);

const garbageHole = (board: SimBoard, seed: number): number => {
	const open = STACK_COLUMNS.filter((x) => board.rows.every((row) => ((row >> x) & 1) === 0));
	const columns = open.length > 0 ? open : STACK_COLUMNS;

	return columns[Math.floor(new RNG(seed).nextFloat() * columns.length)] ?? 0;
};

const RAISED = SPREAD.slice(0, 2).flatMap((boards, bucket) =>
	boards.slice(0, 30).map((board, index) => {
		const seed = bucket * 100 + index + 1;

		return { seed, board: raised(board, 1 + (index % 4), garbageHole(board, seed)) };
	}),
);

describe("searchQuadReady against a brute force", () => {
	SPREAD.forEach((boards, bucket) => {
		it(`agrees at depth 2 with hold on, window gap up to ${(bucket + 1) * 4}`, () => {
			boards.forEach((board, index) => crossCheck(stateOf(board, bucket * 100 + index + 1, true), 2));
		});

		it(`agrees at depth 3 with hold on and depth 4 with hold off, window gap up to ${(bucket + 1) * 4}`, () => {
			boards.slice(0, 10).forEach((board, index) => {
				crossCheck(stateOf(board, bucket * 100 + index + 1, true), 3);
				crossCheck(stateOf(board, bucket * 100 + index + 1, false), 4);
			});
		});

		it(`agrees at depth 2 with holes and any clear allowed, window gap up to ${(bucket + 1) * 4}`, () => {
			boards
				.slice(0, 10)
				.forEach((board, index) => crossCheck(stateOf(board, bucket * 100 + index + 1, true), 2, OPEN_RULES));
		});
	});

	it.each([
		["quad clears only", WELL_RULES],
		["any hole-free clear", CLEAR_RULES],
	] as const)("agrees at depth 3 on stacks raised over garbage, window gap up to 8, %s", (_, rules) => {
		RAISED.forEach(({ seed, board }) => crossCheck(stateOf(board, seed, true), 3, rules));
	});

	it.each([
		[
			"eight cells for four Os",
			["........#.", FULL, FULL, FULL],
			Mino.O,
			[Mino.O, Mino.O, Mino.O, Mino.O, Mino.O],
			WELL_RULES,
			4,
		],
		[
			"eight cells over a covered well cell",
			["........#.", FULL, FULL, FULL, "####.#####", FULL],
			Mino.O,
			[Mino.O, Mino.I, Mino.S, Mino.Z, Mino.S],
			WELL_RULES,
			3,
		],
		[
			"a two-row gap",
			["......###.", "......###.", FULL, FULL],
			Mino.I,
			[Mino.I, Mino.O, Mino.O, Mino.O, Mino.O],
			WELL_RULES,
			3,
		],
		[
			"a ragged window",
			["#..#..###.", "#......##.", "##...####.", FULL],
			Mino.T,
			[Mino.L, Mino.J, Mino.O, Mino.S, Mino.Z],
			WELL_RULES,
			null,
		],
		[
			"a four-line clear outside the well",
			[".#########", ".#########", ".#########", ".#########"],
			Mino.I,
			[Mino.I, Mino.O, Mino.O, Mino.O, Mino.O],
			WELL_RULES,
			null,
		],
		[
			"a window open at column 4 over four garbage rows open there",
			[
				"####.####.",
				"####.####.",
				"####.####.",
				"####.####.",
				"####.#####",
				"####.#####",
				"####.#####",
				"####.#####",
			],
			Mino.I,
			[Mino.I, Mino.O, Mino.O, Mino.O, Mino.O],
			WELL_RULES,
			2,
		],
		[
			"a window open at column 4 over a garbage row open there, any clear",
			["####.####.", "####.####.", "####.####.", "####.####.", "####.#####"],
			Mino.I,
			[Mino.I, Mino.O, Mino.O, Mino.O, Mino.O],
			CLEAR_RULES,
			2,
		],
		[
			"a window open at column 4 over a garbage row open there, quad clears only",
			["####.####.", "####.####.", "####.####.", "####.####.", "####.#####"],
			Mino.I,
			[Mino.I, Mino.O, Mino.O, Mino.O, Mino.O],
			WELL_RULES,
			null,
		],
	] as const)("agrees on %s", (_, rows, current, queue, rules, locks) => {
		const result = crossCheck(
			{ board: boardOf(rows), current, hold: null, holdEnabled: false, holdLocked: false, queue },
			4,
			rules,
		);

		expect(result.kind === "reached" ? result.locks : null).toBe(locks);
	});

	it("agrees when a clear uncovers a garbage hole in the well column and drops the window", () => {
		const board = boardOf(["#####.###.", "#####.###.", "#####.###.", "#####.###.", "#####.####", FULL]);
		const state: SearchState = {
			board,
			current: Mino.I,
			hold: null,
			holdEnabled: false,
			holdLocked: false,
			queue: [Mino.O, Mino.O, Mino.O],
		};
		const result = crossCheck(state, 4, OPEN_RULES);

		expect(result.kind === "reached" && result.locks).toBe(2);
		expect(crossCheck(state, 4).kind).toBe("beyond");
	});
});
