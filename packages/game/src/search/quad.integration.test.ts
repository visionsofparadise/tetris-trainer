import { Mino, RNG } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../config";
import { BAG, cellsKey, type Piece } from "../pieces";
import { emptySimBoard, lockCells, type SimBoard } from "../sim/simBoard";
import { spreadBoards } from "./boardSpread";
import { generateMoves, type Move, type Mover, type MoveRules } from "./moves";
import { isQuadReady, searchQuadReady } from "./quad";
import type { SearchResult, SearchState } from "./searchState";

const WELL = 9;

const GOAL = { well: WELL };

const FULL = "#########.";

const MOVER: Mover = { handling: DEFAULT_CONFIG.handling, gravity: 0.02 };

const WELL_RULES: MoveRules = {
	allow180: true,
	excluded: Object.fromEntries(BAG.filter((mino) => mino !== Mino.I).map((mino) => [mino, [WELL]])),
	holeFreeOnly: true,
	ceiling: null,
	quadClearsOnly: true,
};

interface BruteStep {
	readonly kind: "place" | "hold";
	readonly piece: Piece;
	readonly hold: Piece | null | "unknown";
	readonly next: number;
}

interface BruteState {
	readonly board: SimBoard;
	readonly hold: Piece | null | "unknown";
	readonly next: number;
}

const bruteSteps = (state: SearchState, { hold, next }: BruteState): Array<BruteStep> => {
	const sequence = [state.current, ...state.queue];
	const current = sequence[next];
	const following = sequence[next + 1];
	const steps: Array<BruteStep> = [];

	if (current) steps.push({ kind: "place", piece: current, hold, next: next + 1 });

	if (!state.holdEnabled) return steps;

	if (hold !== null && hold !== "unknown" && hold !== current)
		steps.push({ kind: "hold", piece: hold, hold: current ?? "unknown", next: next + 1 });

	if (hold === null && current && following)
		steps.push({ kind: "hold", piece: following, hold: current, next: next + 2 });

	return steps;
};

const OPEN_RULES: MoveRules = { ...WELL_RULES, holeFreeOnly: false, quadClearsOnly: false };

const bruteMoves = (board: SimBoard, piece: Piece, rules: MoveRules): Array<Move> =>
	generateMoves(board, piece, rules, MOVER).filter(
		(move) => move.cells.every(([x]) => x !== WELL) || lockCells(board, move.cells, move.spin).lines === 4,
	);

const reachesWithin = (state: SearchState, rules: MoveRules, at: BruteState, locks: number): boolean =>
	bruteSteps(state, at).some((step) =>
		bruteMoves(at.board, step.piece, rules).some((move) => {
			const lock = lockCells(at.board, move.cells, move.spin);

			return (
				isQuadReady(lock, step.piece, GOAL) ||
				(locks > 1 &&
					reachesWithin(state, rules, { board: lock.board, hold: step.hold, next: step.next }, locks - 1))
			);
		}),
	);

const bruteFirstSteps = (state: SearchState, rules: MoveRules, locks: number): Array<string> => {
	const root: BruteState = { board: state.board, hold: state.hold, next: 0 };

	return bruteSteps(state, root).flatMap((step) =>
		bruteMoves(state.board, step.piece, rules)
			.filter((move) => {
				const lock = lockCells(state.board, move.cells, move.spin);

				return (
					isQuadReady(lock, step.piece, GOAL) ||
					(locks > 1 &&
						reachesWithin(state, rules, { board: lock.board, hold: step.hold, next: step.next }, locks - 1))
				);
			})
			.map((move) => `${step.kind} ${cellsKey(move.cells)} ${move.spin}`),
	);
};

const bruteSearch = (state: SearchState, rules: MoveRules, depth: number): { readonly locks: number | null } => {
	const root: BruteState = { board: state.board, hold: state.hold, next: 0 };

	for (let locks = 1; locks <= depth; locks++) if (reachesWithin(state, rules, root, locks)) return { locks };

	return { locks: null };
};

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

	return { board, current, hold, holdEnabled, queue };
};

const crossCheck = (state: SearchState, depth: number, checkTies: boolean, rules = WELL_RULES): SearchResult => {
	const result = searchQuadReady(state, GOAL, rules, MOVER, { nodes: 1_000_000, depth });
	const brute = bruteSearch(state, rules, depth);

	expect(result.kind).toBe(brute.locks === null ? "beyond" : "reached");

	if (result.kind !== "reached") return result;

	expect(result.locks).toBe(brute.locks);

	if (checkTies) expect(searchedSteps(result)).toEqual(bruteFirstSteps(state, rules, result.locks).sort());
	else
		for (const { kind, move } of result.firstSteps) {
			const steps = bruteSteps(state, { board: state.board, hold: state.hold, next: 0 });
			const step = steps.find((candidate) => candidate.kind === kind && candidate.piece === move.placement.mino);
			const lock = lockCells(state.board, move.cells, move.spin);

			expect(step).toBeDefined();
			expect(
				(step !== undefined && isQuadReady(lock, step.piece, GOAL)) ||
					(step !== undefined &&
						reachesWithin(
							state,
							rules,
							{ board: lock.board, hold: step.hold, next: step.next },
							result.locks - 1,
						)),
			).toBe(true);
		}

	return result;
};

const boardOf = (rows: ReadonlyArray<string>): SimBoard => {
	const board = emptySimBoard();

	[...rows].reverse().forEach((row, y) => {
		board.rows[y] = [...row].reduce((mask, cell, x) => (cell === "#" ? mask | (1 << x) : mask), 0);
	});

	return board;
};

const SPREAD = spreadBoards(1, 50, WELL);

describe("searchQuadReady against a brute force", () => {
	SPREAD.forEach((boards, bucket) => {
		it(`agrees at depth 2 with hold on, window gap up to ${(bucket + 1) * 4}`, () => {
			boards.forEach((board, index) => crossCheck(stateOf(board, bucket * 100 + index + 1, true), 2, true));
		});

		it(`agrees at depth 3 with hold on and depth 4 with hold off, window gap up to ${(bucket + 1) * 4}`, () => {
			boards.slice(0, 10).forEach((board, index) => {
				crossCheck(stateOf(board, bucket * 100 + index + 1, true), 3, false);
				crossCheck(stateOf(board, bucket * 100 + index + 1, false), 4, false);
			});
		});

		it(`agrees at depth 2 with holes and any clear allowed, window gap up to ${(bucket + 1) * 4}`, () => {
			boards
				.slice(0, 10)
				.forEach((board, index) => crossCheck(stateOf(board, bucket * 100 + index + 1, true), 2, true, OPEN_RULES));
		});
	});

	it.each([
		[
			"eight cells for four Os",
			["........#.", FULL, FULL, FULL],
			Mino.O,
			[Mino.O, Mino.O, Mino.O, Mino.O, Mino.O],
			4,
		],
		[
			"eight cells over a covered well cell",
			["........#.", FULL, FULL, FULL, "####.#####", FULL],
			Mino.O,
			[Mino.O, Mino.I, Mino.S, Mino.Z, Mino.S],
			3,
		],
		["a two-row gap", ["......###.", "......###.", FULL, FULL], Mino.I, [Mino.I, Mino.O, Mino.O, Mino.O, Mino.O], 3],
		[
			"a ragged window",
			["#..#..###.", "#......##.", "##...####.", FULL],
			Mino.T,
			[Mino.L, Mino.J, Mino.O, Mino.S, Mino.Z],
			null,
		],
	] as const)("agrees on %s", (_, rows, current, queue, locks) => {
		const result = crossCheck({ board: boardOf(rows), current, hold: null, holdEnabled: false, queue }, 4, true);

		expect(result.kind === "reached" ? result.locks : null).toBe(locks);
	});

	it("agrees when a clear uncovers a garbage hole in the well column and drops the window", () => {
		const board = boardOf(["#####.###.", "#####.###.", "#####.###.", "#####.###.", "#####.####", FULL]);
		const state: SearchState = {
			board,
			current: Mino.I,
			hold: null,
			holdEnabled: false,
			queue: [Mino.O, Mino.O, Mino.O],
		};
		const result = crossCheck(state, 4, true, OPEN_RULES);

		expect(result.kind === "reached" && result.locks).toBe(2);
		expect(crossCheck(state, 4, true).kind).toBe("beyond");
	});
});
