import { DEMO_HANDLING, type Game, LIVE_BUDGET, type Move, type Mover } from "@tetris-trainer/game";
import { emptyOpening, openingGame } from "./boards";
import { wellOverlays } from "./overlays";
import { chooseMove, choiceKeys } from "./policy";
import { goalOf, wellsRules, WELLS_GRAVITY } from "./rules";
import { wellStage, type WellStage } from "./stages";
import type { DealWatch } from "../drill/drillWatch";

const WATCH_LOCKS = 30;

const THINK_MS = 300;

const QUAD_LINES = 4;

const SEED_RANGE = 2147483646;

const WATCH_MOVER: Mover = { handling: DEMO_HANDLING, gravity: WELLS_GRAVITY };

const NO_NARRATION: ReadonlyArray<string> = [];

const watchStage = (round: number): WellStage => wellStage(round % 2 === 0 ? "nine-zero" : "six-three");

const sideOf = (stage: WellStage, { cells, lines }: Move): string => {
	if (lines === QUAD_LINES) return "Quad";

	if (stage.layout === "6-3") return cells.every(([x]) => x < stage.well) ? "Six-side" : "Three-side";

	return cells.some(([x]) => x === stage.well - 1) ? "Beside the well" : "Stack";
};

const watchLine = (stage: WellStage, move: Move): string =>
	`${sideOf(stage, move)}: ${move.placement.mino.toUpperCase()}`;

export const watchGame = (seed: number): Game => openingGame(emptyOpening(seed), DEMO_HANDLING);

export const wellsWatch: DealWatch = (_player, search, round) => {
	const stage = watchStage(round);
	const rules = wellsRules(stage, true);
	const goal = goalOf(stage);

	return {
		game: watchGame(1 + Math.floor(Math.random() * SEED_RANGE)),
		locks: WATCH_LOCKS,
		marks: [],
		overlays: (board) => wellOverlays(stage, board),
		narration: NO_NARRATION,
		play: async (spawn) => {
			await new Promise((resolve) => setTimeout(resolve, THINK_MS));

			const before = await search.quadReady(spawn, goal, rules, WATCH_MOVER, LIVE_BUDGET);
			const choice = chooseMove(spawn, before, stage, rules, WATCH_MOVER, true);

			return { steps: choiceKeys(choice), line: choice && watchLine(stage, choice.move) };
		},
	};
};
