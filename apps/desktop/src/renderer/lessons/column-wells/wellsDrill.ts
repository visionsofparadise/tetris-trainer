import { LIVE_BUDGET, type ScriptStep, type SearchState } from "@tetris-trainer/game";
import { nextSeed, openingFor, openingGame, type WellsOpening } from "./boards";
import { callLock, type Searched } from "./judge";
import { wellOverlays } from "./overlays";
import { chooseMove, choiceKeys } from "./policy";
import { goalOf, moverOf, wellsRules } from "./rules";
import { WELL_STAGES, type WellStage } from "./stages";
import { wellsWatch } from "./watch";
import type { Drill, DrillWords, JudgeContext } from "../drill/Drill";

export interface WellsState {
	readonly stage: WellStage;
	readonly seed: number;
	readonly round: number;
	readonly opening: WellsOpening;
	readonly lines: number;
	readonly mistakes: number;
	readonly converted: number;
	readonly search: Searched | null;
	readonly passed: boolean;
	readonly over: boolean;
}

const WORDS: DrillWords = { next: "Next run", why: "Why this placement" };

const NO_MARKS = [] as const;

const roundOf = (stage: WellStage, seed: number, round: number, converted: number): WellsState => ({
	stage,
	seed,
	round,
	opening: openingFor(stage, seed),
	lines: 0,
	mistakes: 0,
	converted,
	search: null,
	passed: false,
	over: false,
});

export const startWells = (stage: WellStage, seed: number): WellsState => roundOf(stage, seed, 0, 0);

export const replayRound = (state: WellsState): WellsState => ({
	...state,
	lines: 0,
	mistakes: 0,
	search: null,
	passed: false,
	over: false,
});

const nextRound = (state: WellsState): WellsState =>
	roundOf(state.stage, nextSeed(state.seed), state.round + 1, state.converted);

export const isGoalMet = ({ stage, lines, mistakes }: WellsState, ready: boolean): boolean => {
	if (stage.lines === null) return ready;

	return lines >= stage.lines && (stage.onMistake === "pause" || mistakes === 0);
};

const progressOf = ({ stage, lines, converted }: WellsState): { readonly label: string; readonly value: string } =>
	stage.lines === null
		? { label: "Boards converted", value: String(converted) }
		: { label: "Lines", value: `${Math.min(lines, stage.lines)} / ${stage.lines}` };

const delegateKeys = async (
	state: WellsState,
	spawn: SearchState,
	{ player, search }: JudgeContext,
): Promise<ReadonlyArray<ScriptStep>> => {
	const { stage } = state;
	const rules = wellsRules(stage, player.allow180);
	const mover = moverOf(player);
	const known = state.search?.state === spawn ? state.search.result : null;
	const before = known ?? (await search.quadReady(spawn, goalOf(stage), rules, mover, LIVE_BUDGET));

	return choiceKeys(chooseMove(spawn, before, stage, rules, mover, false));
};

export const WELLS_DRILL: Drill<WellsState, WellStage> = {
	stages: WELL_STAGES,
	words: WORDS,
	start: startWells,
	deal: (state, player, round) => {
		const next = round === "next" ? nextRound(state) : replayRound(state);

		return { game: openingGame(next.opening, player.handling), state: next };
	},
	judge: async (state, lock, context) => {
		const call = await callLock(state.stage, state.search, lock, context);

		if (!call.ok)
			return {
				verdict: { ok: false, ...call.mistake },
				next: { ...state, mistakes: state.mistakes + 1, search: call.search },
			};

		const counted = { ...state, lines: state.lines + lock.event.lines, search: call.search };
		const passed = isGoalMet(counted, call.ready);

		return {
			verdict: { ok: true },
			next: { ...counted, passed, over: passed, converted: counted.converted + (passed ? 1 : 0) },
		};
	},
	isRoundOver: ({ over }) => over,
	isPassed: ({ passed }) => passed,
	progress: progressOf,
	marks: () => NO_MARKS,
	overlays: ({ stage }, board) => wellOverlays(stage, board),
	describe: ({ stage, round, opening, lines, mistakes }) =>
		JSON.stringify({ stage: stage.id, round, seed: opening.seed, lines, mistakes }),
	owns: ({ stage }, mino) => stage.owned.includes(mino),
	delegate: delegateKeys,
	onContinue: "resume",
	watch: wellsWatch,
};
