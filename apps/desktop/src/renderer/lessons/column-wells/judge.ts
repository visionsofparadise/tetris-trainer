import {
	BAG,
	cellsKey,
	generateMoves,
	homeless,
	isHoleFree,
	isQuadReady,
	judgeDistance,
	LIVE_BUDGET,
	lockCells,
	type Move,
	type Mover,
	type MoveRules,
	type Piece,
	type QuadGoal,
	type SearchResult,
	type SearchState,
} from "@tetris-trainer/game";
import { wellOverlays } from "./overlays";
import { candidatesFor, pickMove } from "./policy";
import { goalOf, isOverCeiling, isWellMove, isWrongSide, moverOf, wellsRules } from "./rules";
import type { WellStage } from "./stages";
import type { SearchClient } from "../../search/SearchClient";
import type { DrillLock, DrillMistake, JudgeContext } from "../drill/Drill";

export interface Searched {
	readonly state: SearchState;
	readonly result: SearchResult;
}

type WellsMistakeKind =
	"well-blocked" | "wrong-side" | "hole" | "homeless" | "slow-count" | "non-quad-clear" | "over-ceiling";

export type WellsCall =
	| { readonly ok: true; readonly search: Searched | null; readonly ready: boolean }
	| { readonly ok: false; readonly mistake: DrillMistake; readonly search: Searched | null };

interface Judging {
	readonly stage: WellStage;
	readonly goal: QuadGoal;
	readonly rules: MoveRules;
	readonly mover: Mover;
	readonly search: SearchClient;
	readonly lock: DrillLock;
	readonly mino: Piece;
	readonly known: Searched | null;
}

const TITLES: Record<WellsMistakeKind, string> = {
	"well-blocked": "Well blocked",
	"wrong-side": "Wrong side",
	hole: "Hole",
	homeless: "Homeless",
	"slow-count": "Slow count",
	"non-quad-clear": "Non-quad clear",
	"over-ceiling": "Over the ceiling",
};

const QUAD_LINES = 4;

const isAppLock = ({ event }: DrillLock): boolean => event.inputs.some(({ source }) => source === "script");

const searchOf = async (judging: Judging, state: SearchState): Promise<SearchResult> => {
	const { known, search, goal, rules, mover } = judging;

	return known?.state === state ? known.result : search.quadReady(state, goal, rules, mover, LIVE_BUDGET);
};

const bestMove = (judging: Judging, before: SearchResult | null): Move | null => {
	const { lock, mino, stage, goal, rules, mover } = judging;

	if (before?.kind === "reached") {
		const steps = before.firstSteps;
		const step = steps.find(({ move }) => move.placement.mino === mino) ?? steps.find(({ kind }) => kind === "place");

		if (step) return step.move;
	}

	const { board } = lock.before;

	return pickMove(candidatesFor(board, mino, stage, rules, mover), board, goal, rules);
};

const mistakeOf = (judging: Judging, kind: WellsMistakeKind, best: Move | null, detail?: string): DrillMistake => ({
	kind,
	title: TITLES[kind],
	detail,
	placed: judging.lock.event.cells,
	best: best?.placement ?? null,
	overlays: wellOverlays(judging.stage, judging.lock.after.board),
});

const holdPieces = ({ hold, holdEnabled, holdLocked, queue }: SearchState): ReadonlyArray<Piece> => {
	const held = hold ?? queue[0];

	return holdEnabled && !holdLocked && held !== undefined ? [held] : [];
};

const cleanMoves = ({ lock, stage, rules, mover }: Judging, mino: Piece): Array<Move> =>
	generateMoves(lock.before.board, mino, rules, mover).filter(({ cells, lines }) => !isWellMove(cells, lines, stage));

const holeMistake = (judging: Judging, before: SearchResult): DrillMistake | null => {
	const { lock, mino, goal, rules } = judging;

	if (cleanMoves(judging, mino).length > 0) return mistakeOf(judging, "hole", bestMove(judging, before));

	const held = [lock.before.current, ...holdPieces(lock.before)].find((piece) => piece !== mino);
	const moves = held === undefined ? [] : cleanMoves(judging, held);

	if (held === undefined || moves.length === 0) return null;

	const best = pickMove(moves, lock.before.board, goal, rules);

	return mistakeOf(judging, "hole", best, `Hold for the ${held.toUpperCase()}: it has a clean spot.`);
};

const tiedMoves = (before: SearchResult, mino: Piece): ReadonlySet<string> | null =>
	before.kind === "reached"
		? new Set(before.firstSteps.flatMap(({ move }) => (move.placement.mino === mino ? [cellsKey(move.cells)] : [])))
		: null;

interface Housed {
	readonly move: Move;
	readonly kept: ReadonlyArray<Piece>;
}

const housedAlternative = async (
	judging: Judging,
	before: SearchResult,
	left: ReadonlyArray<Piece>,
): Promise<Housed | null> => {
	const { lock, mino, stage, rules, mover, search } = judging;
	const tied = tiedMoves(before, mino);
	const results = await search.fitAfter(lock.before.board, mino, BAG, rules, mover);
	const [best] = results
		.filter(
			({ move, homeless: other }) =>
				other.length < left.length &&
				other.every((piece) => left.includes(piece)) &&
				!isWellMove(move.cells, move.lines, stage) &&
				(tied === null || tied.has(cellsKey(move.cells))),
		)
		.sort((first, second) => first.homeless.length - second.homeless.length);

	return best ? { move: best.move, kept: left.filter((piece) => !best.homeless.includes(piece)) } : null;
};

const distanceText = (before: SearchResult, after: SearchResult): string => {
	const best = before.kind === "reached" ? before.locks - 1 : 0;
	const yours = after.kind === "reached" ? `${after.locks} more` : "past the queue";

	return `Best: ready ${best === 0 ? "with this piece" : `in ${best} more`}. Yours: ${yours}.`;
};

const pieceList = (pieces: ReadonlyArray<Piece>): string => pieces.map((mino) => mino.toUpperCase()).join(" ");

const ruleMistake = async (judging: Judging, before: SearchResult): Promise<DrillMistake | null> => {
	const { lock, stage, mino } = judging;
	const { cells, lines } = lock.event;

	if (isWellMove(cells, lines, stage)) return mistakeOf(judging, "well-blocked", bestMove(judging, before));

	if (isWrongSide(mino, cells, stage)) return mistakeOf(judging, "wrong-side", bestMove(judging, before));

	if (!isHoleFree(lock.before.board, cells)) {
		const hole = holeMistake(judging, before);

		if (hole) return hole;
	}

	if (lines === QUAD_LINES) return null;

	const left = homeless(lock.after.board, BAG, judging.rules);

	if (left.length === 0) return null;

	const housed = await housedAlternative(judging, before, left);

	return housed
		? mistakeOf(judging, "homeless", housed.move, `No clean spot left for ${pieceList(housed.kept)}.`)
		: null;
};

const countMistake = (
	judging: Judging,
	before: SearchResult,
	after: SearchResult,
	ready: boolean,
): DrillMistake | null => {
	const { lock, stage } = judging;
	const { cells, lines } = lock.event;

	if (judgeDistance(before, after, ready) === "fail")
		return mistakeOf(judging, "slow-count", bestMove(judging, before), distanceText(before, after));

	if (lines > 0 && lines < QUAD_LINES)
		return mistakeOf(judging, "non-quad-clear", bestMove(judging, before), `Cleared ${lines} without a quad.`);

	return isOverCeiling(cells, stage) ? mistakeOf(judging, "over-ceiling", bestMove(judging, before)) : null;
};

export const callLock = async (
	stage: WellStage,
	known: Searched | null,
	lock: DrillLock,
	{ player, search }: JudgeContext,
): Promise<WellsCall> => {
	const { event, before, after } = lock;
	const { mino } = event.placement;
	const goal = goalOf(stage);

	const judging: Judging = {
		stage,
		goal,
		rules: wellsRules(stage, player.allow180),
		mover: moverOf(player),
		search,
		lock,
		mino,
		known,
	};
	const ready = isQuadReady(lockCells(before.board, event.cells, event.spin), event.cells, goal);

	if (isAppLock(lock)) return { ok: true, search: null, ready };

	const beforeSearch = await searchOf(judging, before);
	const rule = await ruleMistake(judging, beforeSearch);

	if (rule) return { ok: false, mistake: rule, search: null };

	const afterSearch = await searchOf(judging, after);
	const searched: Searched = { state: after, result: afterSearch };
	const counted = countMistake(judging, beforeSearch, afterSearch, ready);

	return counted ? { ok: false, mistake: counted, search: searched } : { ok: true, search: searched, ready };
};
