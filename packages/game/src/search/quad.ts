import { Mino } from "@haelp/teto/engine";
import { BOARD_COLUMNS } from "../engineOptions";
import { BAG, type Block, type Piece } from "../pieces";
import { BOARD_ROWS, FULL_ROW, lockCells, type SimBoard, type SimLock } from "../sim/simBoard";
import { generateMoves, type Move, type Mover, type MoveRules } from "./moves";
import type { RouteStep, SearchBudget, SearchResult, SearchState } from "./searchState";

export interface QuadGoal {
	readonly well: number;
}

export type Call = "pass" | "fail" | "silent";

interface Candidate {
	readonly move: Move;
	readonly goal: boolean;
	readonly windowCells: number;
	readonly lines: number;
	child: Entry | null;
}

interface Entry {
	readonly board: SimBoard;
	readonly empty: number;
	readonly floor: number;
	readonly candidates: Array<ReadonlyArray<Candidate> | undefined>;
	readonly failed: Map<number, number>;
}

interface Step {
	readonly kind: RouteStep["kind"];
	readonly piece: Piece;
	readonly hold: number;
	readonly next: number;
}

interface Child {
	readonly step: Step;
	readonly candidate: Candidate;
	readonly bound: number;
}

interface Search {
	readonly wellMask: number;
	readonly rules: MoveRules;
	readonly mover: Mover;
	readonly sequence: ReadonlyArray<Piece>;
	readonly holdEnabled: boolean;
	readonly holdLocked: boolean;
	readonly nodeLimit: number;
	readonly deadline: number;
	readonly loose: boolean;
	readonly entries: Map<string, Entry>;
	nodes: number;
	exhausted: boolean;
}

const WINDOW_ROWS = 4;

const QUAD_LINES = 4;

const MAX_LOCKS = 6;

const NO_HOLD = BAG.length;

const UNKNOWN_HOLD = BAG.length + 1;

const STATE_SLOTS = 16;

const cellCount = (mask: number): number => {
	let count = 0;

	for (let rest = mask; rest !== 0; rest &= rest - 1) count++;

	return count;
};

const wellFloor = (rows: Uint16Array, wellMask: number): number => {
	for (let y = BOARD_ROWS - 1; y >= 0; y--) if (((rows[y] ?? 0) & wellMask) !== 0) return y + 1;

	return 0;
};

const windowEmpty = (rows: Uint16Array, wellMask: number, floor: number): number => {
	let empty = 0;

	for (let y = floor; y < floor + WINDOW_ROWS; y++) empty += cellCount(~(rows[y] ?? 0) & FULL_ROW & ~wellMask);

	return empty;
};

const hasCoveredWellCell = (rows: Uint16Array, wellMask: number, floor: number): boolean => {
	for (let y = 0; y < floor; y++) if (((rows[y] ?? 0) & wellMask) === 0) return true;

	return false;
};

const boardKey = (rows: Uint16Array): string => {
	let top = rows.length;

	while (top > 0 && rows[top - 1] === 0) top--;

	return String.fromCharCode(...rows.subarray(0, top));
};

export const readyGap = (board: SimBoard, goal: QuadGoal): number => {
	const wellMask = 1 << goal.well;

	return windowEmpty(board.rows, wellMask, wellFloor(board.rows, wellMask));
};

export const rowsReady = (board: SimBoard, goal: QuadGoal): number => {
	const wellMask = 1 << goal.well;
	const floor = wellFloor(board.rows, wellMask);
	let ready = 0;

	while (ready < WINDOW_ROWS && ((board.rows[floor + ready] ?? 0) | wellMask) === FULL_ROW) ready++;

	return ready;
};

export const windowFill = (board: SimBoard, goal: QuadGoal): number =>
	WINDOW_ROWS * (BOARD_COLUMNS - 1) - readyGap(board, goal);

export const isQuadReady = (lock: SimLock, cells: ReadonlyArray<Block>, goal: QuadGoal): boolean =>
	(lock.lines === QUAD_LINES && cells.some(([x]) => x === goal.well)) || readyGap(lock.added, goal) === 0;

export const judgeDistance = (before: SearchResult, after: SearchResult, reachedOnLock: boolean): Call => {
	if (before.kind !== "reached" || after.kind === "unknown") return "silent";

	if (reachedOnLock) return "pass";

	if (after.kind === "beyond") return "fail";

	return after.locks <= before.locks - 1 ? "pass" : "fail";
};

const searchRules = (rules: MoveRules, well: number): MoveRules => ({
	...rules,
	excluded: Object.fromEntries(
		BAG.map((mino) => [
			mino,
			mino === Mino.I ? (rules.excluded[mino] ?? []) : [...(rules.excluded[mino] ?? []), well],
		]),
	),
});

const boundOf = (search: Search, empty: number): number =>
	search.loose ? Math.min(empty, 1) : Math.ceil(empty / QUAD_LINES);

const entryOf = (search: Search, board: SimBoard): Entry => {
	const key = boardKey(board.rows);
	const known = search.entries.get(key);

	if (known) return known;

	const floor = wellFloor(board.rows, search.wellMask);
	const entry: Entry = {
		board,
		floor,
		empty: windowEmpty(board.rows, search.wellMask, floor),
		candidates: [],
		failed: new Map(),
	};

	search.entries.set(key, entry);

	return entry;
};

const candidateOf = (search: Search, entry: Entry, move: Move): Candidate | null => {
	const { lines } = move;
	const inWell = move.cells.some(([x]) => ((1 << x) & search.wellMask) !== 0);
	const top = entry.floor + WINDOW_ROWS;

	if (inWell && lines !== QUAD_LINES) return null;

	const windowCells = move.cells.filter(([, y]) => y >= entry.floor && y < top).length;

	return {
		move,
		lines,
		windowCells,
		goal: (inWell && lines === QUAD_LINES) || windowCells === entry.empty,
		child: null,
	};
};

const candidatesOf = (search: Search, entry: Entry, piece: Piece): ReadonlyArray<Candidate> | null => {
	const index = BAG.indexOf(piece);
	const known = entry.candidates[index];

	if (known) return known;

	if (search.nodes >= search.nodeLimit || performance.now() > search.deadline) {
		search.exhausted = true;

		return null;
	}

	search.nodes++;

	const candidates = generateMoves(entry.board, piece, search.rules, search.mover).flatMap((move) => {
		const candidate = candidateOf(search, entry, move);

		return candidate ? [candidate] : [];
	});

	entry.candidates[index] = candidates;

	return candidates;
};

const childOf = (search: Search, entry: Entry, candidate: Candidate): Entry => {
	if (candidate.child) return candidate.child;

	const child = entryOf(search, lockCells(entry.board, candidate.move.cells, candidate.move.spin).board);

	candidate.child = child;

	return child;
};

const stepsOf = (search: Search, hold: number, next: number): Array<Step> => {
	const { sequence } = search;
	const current = sequence[next];
	const steps: Array<Step> = [];

	if (current !== undefined) steps.push({ kind: "place", piece: current, hold, next: next + 1 });

	if (!search.holdEnabled || (next === 0 && search.holdLocked)) return steps;

	const held = BAG[hold];
	const currentCode = current === undefined ? UNKNOWN_HOLD : BAG.indexOf(current);

	if (held !== undefined && held !== current)
		steps.push({ kind: "hold", piece: held, hold: currentCode, next: next + 1 });

	const following = sequence[next + 1];

	if (hold === NO_HOLD && current !== undefined && following !== undefined)
		steps.push({ kind: "hold", piece: following, hold: currentCode, next: next + 2 });

	return steps;
};

const childrenOf = (search: Search, entry: Entry, hold: number, next: number, limit: number): Array<Child> | null => {
	const children: Array<Child> = [];

	for (const step of stepsOf(search, hold, next)) {
		const candidates = candidatesOf(search, entry, step.piece);

		if (!candidates) return null;

		for (const candidate of candidates) {
			const bound = candidate.goal
				? 0
				: candidate.lines > 0
					? boundOf(search, childOf(search, entry, candidate).empty)
					: boundOf(search, entry.empty - candidate.windowCells);

			if (bound <= limit) children.push({ step, candidate, bound });
		}
	}

	return children.sort((first, second) => first.bound - second.bound);
};

const reaches = (search: Search, entry: Entry, hold: number, next: number, locks: number): boolean => {
	const slot = hold * STATE_SLOTS + next;

	if ((entry.failed.get(slot) ?? 0) >= locks) return false;

	const children = childrenOf(search, entry, hold, next, locks - 1);

	if (!children) return false;

	for (const { step, candidate } of children) {
		if (candidate.goal) return true;

		if (reaches(search, childOf(search, entry, candidate), step.hold, step.next, locks - 1)) return true;

		if (search.exhausted) return false;
	}

	entry.failed.set(slot, locks);

	return false;
};

const firstStepsWithin = (search: Search, root: Entry, hold: number, locks: number): Array<RouteStep> | null => {
	const children = childrenOf(search, root, hold, 0, locks - 1);

	if (!children) return null;

	const firstSteps: Array<RouteStep> = [];

	for (const { step, candidate } of children) {
		if (candidate.goal || reaches(search, childOf(search, root, candidate), step.hold, step.next, locks - 1))
			firstSteps.push({ kind: step.kind, move: candidate.move });

		if (search.exhausted) return null;
	}

	return firstSteps;
};

export const searchQuadReady = (
	state: SearchState,
	goal: QuadGoal,
	rules: MoveRules,
	mover: Mover,
	budget: SearchBudget,
): SearchResult => {
	const wellMask = 1 << goal.well;
	const sequence = [state.current, ...state.queue];
	const floor = wellFloor(state.board.rows, wellMask);
	const search: Search = {
		wellMask,
		rules: searchRules(rules, goal.well),
		mover,
		sequence,
		holdEnabled: state.holdEnabled,
		holdLocked: state.holdLocked,
		nodeLimit: budget.nodes,
		deadline: budget.deadlineMs === null ? Infinity : performance.now() + budget.deadlineMs,
		loose: !rules.quadClearsOnly && hasCoveredWellCell(state.board.rows, wellMask, floor),
		entries: new Map(),
		nodes: 0,
		exhausted: false,
	};
	const root = entryOf(search, state.board);
	const hold = state.hold === null ? NO_HOLD : BAG.indexOf(state.hold);
	const horizon = sequence.length + (state.holdEnabled && state.hold !== null ? 1 : 0);
	const depth = Math.min(budget.depth, MAX_LOCKS, horizon);

	for (let locks = Math.max(1, boundOf(search, root.empty)); locks <= depth; locks++) {
		const firstSteps = firstStepsWithin(search, root, hold, locks);

		if (!firstSteps) return { kind: "unknown", nodes: search.nodes };

		if (firstSteps.length > 0) return { kind: "reached", locks, firstSteps, nodes: search.nodes };
	}

	return { kind: "beyond", nodes: search.nodes };
};
