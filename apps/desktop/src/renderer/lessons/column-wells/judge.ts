import {
	BAG,
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
import { isStrictSubset, judgedAlternatives, passingMoves, pickMove, turnOptions, type TurnOption } from "./policy";
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
	readonly allow180: boolean;
	readonly mover: Mover;
	readonly search: SearchClient;
	readonly lock: DrillLock;
	readonly mino: Piece;
	readonly known: Searched | null;
	readonly options: ReadonlyArray<TurnOption>;
}

interface Green {
	readonly move: Move;
	readonly hold: boolean;
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
	const { known, search, goal, stage, allow180, mover } = judging;

	return known?.state === state
		? known.result
		: search.quadReady(state, goal, wellsRules(stage, allow180, state.board), mover, LIVE_BUDGET);
};

const greenOf = async (
	judging: Judging,
	before: SearchResult,
	options: ReadonlyArray<TurnOption>,
): Promise<Green | null> => {
	const { lock, stage, goal, rules, mover, search } = judging;
	const { board } = lock.before;

	for (const { piece, hold } of options) {
		const fits = await search.fitAfter(board, piece, BAG, rules, mover);
		const move = pickMove(passingMoves(fits, before, piece, stage, board), board, goal, rules);

		if (move) return { move, hold };
	}

	return null;
};

const mistakeOf = (judging: Judging, kind: WellsMistakeKind, green: Green | null, detail?: string): DrillMistake => ({
	kind,
	title: TITLES[kind],
	detail,
	placed: judging.lock.event.cells,
	best: green?.move.placement ?? null,
	overlays: wellOverlays(judging.stage, judging.lock.after.board),
});

const greenMistake = async (
	judging: Judging,
	kind: WellsMistakeKind,
	before: SearchResult,
	detail?: string,
): Promise<DrillMistake> => mistakeOf(judging, kind, await greenOf(judging, before, judging.options), detail);

const cleanMoves = ({ lock, stage, rules, mover }: Judging, mino: Piece): Array<Move> =>
	generateMoves(lock.before.board, mino, rules, mover).filter(
		({ cells, lines }) => !isWellMove(mino, cells, lines, stage, lock.before.board),
	);

const holeMistake = async (judging: Judging, before: SearchResult): Promise<DrillMistake | null> => {
	const { lock, mino, options } = judging;
	const held = mino !== lock.before.current;
	const alternatives = options.filter(({ piece }) => piece === mino || !held);

	if (alternatives.every(({ piece }) => cleanMoves(judging, piece).length === 0)) return null;

	const green = await greenOf(judging, before, alternatives);
	const holdFor = green?.hold === true && green.move.placement.mino !== mino ? green.move.placement.mino : null;

	return mistakeOf(
		judging,
		"hole",
		green,
		holdFor === null ? undefined : `Hold for the ${holdFor.toUpperCase()}: it has a clean spot.`,
	);
};

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
	const { board } = lock.before;
	const fits = await search.fitAfter(board, mino, BAG, rules, mover);
	const [best] = judgedAlternatives(fits, before, mino, stage, board)
		.filter(({ homeless: other }) => isStrictSubset(other, left))
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
	const { lock, stage, mino, rules } = judging;
	const { cells, lines } = lock.event;

	if (isWellMove(mino, cells, lines, stage, lock.before.board)) return greenMistake(judging, "well-blocked", before);

	if (isWrongSide(mino, cells, stage)) return greenMistake(judging, "wrong-side", before);

	if (!isHoleFree(lock.before.board, cells, rules.deadRows)) {
		const hole = await holeMistake(judging, before);

		if (hole) return hole;
	}

	if (lines === QUAD_LINES) return null;

	const left = homeless(lock.after.board, BAG, rules);

	if (left.length === 0) return null;

	const housed = await housedAlternative(judging, before, left);

	return housed
		? mistakeOf(
				judging,
				"homeless",
				{ move: housed.move, hold: false },
				`No clean spot left for ${pieceList(housed.kept)}.`,
			)
		: null;
};

const countMistake = async (
	judging: Judging,
	before: SearchResult,
	after: SearchResult,
	ready: boolean,
): Promise<DrillMistake | null> => {
	const { lock, stage } = judging;
	const { cells, lines } = lock.event;

	if (judgeDistance(before, after, ready) === "fail")
		return greenMistake(judging, "slow-count", before, distanceText(before, after));

	if (lines > 0 && lines < QUAD_LINES)
		return greenMistake(judging, "non-quad-clear", before, `Cleared ${lines} without a quad.`);

	return isOverCeiling(cells, stage) ? greenMistake(judging, "over-ceiling", before) : null;
};

const optionsFor = (lock: DrillLock, stage: WellStage): Array<TurnOption> => {
	const { mino } = lock.event.placement;

	return turnOptions(lock.before, true, stage.owned).sort(
		(first, second) => Number(second.piece === mino) - Number(first.piece === mino),
	);
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
		rules: wellsRules(stage, player.allow180, before.board),
		allow180: player.allow180,
		mover: moverOf(player),
		search,
		lock,
		mino,
		known,
		options: optionsFor(lock, stage),
	};
	const ready = isQuadReady(lockCells(before.board, event.cells, event.spin), event.cells, goal);

	if (isAppLock(lock)) return { ok: true, search: null, ready };

	const beforeSearch = await searchOf(judging, before);
	const rule = await ruleMistake(judging, beforeSearch);

	if (rule) return { ok: false, mistake: rule, search: null };

	const afterSearch = await searchOf(judging, after);
	const searched: Searched = { state: after, result: afterSearch };
	const counted = await countMistake(judging, beforeSearch, afterSearch, ready);

	return counted ? { ok: false, mistake: counted, search: searched } : { ok: true, search: searched, ready };
};
