import { finesseRoutes, Mino, samePlacement, type Piece, type PieceTarget } from "@tetris-trainer/game";
import { loadGame } from "../../utils/loadDemo";
import { DEMO_HANDLING } from "../opener/openerScript";
import { findFault, wrongSpot, type Attempt } from "./faults";
import { routeScript } from "./routeScript";
import { slideTitles } from "./slides";
import { FINESSE_PIECES, FINESSE_TARGETS, pieceSetup, routeRules, targetMarks, targetPlacement } from "./targets";
import type { Drill, DrillStage } from "../drill/Drill";

export type FinesseStageId = "cells" | "keys" | "mixed" | "gravity" | "reset";

interface Result {
	readonly mino: Piece;
	readonly ok: boolean;
}

export interface FinesseState {
	readonly stage: FinesseStageId;
	readonly target: PieceTarget;
	readonly seed: number;
	readonly results: ReadonlyArray<Result>;
}

interface FinesseStage extends DrillStage {
	readonly id: FinesseStageId;
}

export const FINESSE_STAGES: ReadonlyArray<FinesseStage> = [
	{
		id: "cells",
		title: "Spots",
		goal: "Land each piece on its target. 20 in a row unlocks the next piece.",
		onMistake: "pause",
	},
	{
		id: "keys",
		title: "Keys",
		goal: "Land each piece with the fewest presses. 48 of the last 50 unlocks the next piece.",
		onMistake: "pause",
	},
	{
		id: "mixed",
		title: "Mixed",
		goal: "Every piece and every spot, with the fewest presses. 95 of the last 100 passes.",
		onMistake: "pause",
	},
	{
		id: "gravity",
		title: "Gravity",
		goal: "Mixed spots with the piece falling. 95 of the last 100 passes.",
		onMistake: "pause",
	},
	{
		id: "reset",
		title: "Reset",
		goal: "Any fault restarts the run. 40 in a row passes.",
		onMistake: "restart",
	},
];

const MODULUS = 2147483647;

const MULTIPLIER = 16807;

const STREAK = { cells: 20, reset: 40 } as const;

const WINDOWS = { keys: { size: 50, passes: 48 }, mixed: { size: 100, passes: 95 } } as const;

const LAST_PIECE: Piece = Mino.Z;

const randomSeed = (): number => 1 + Math.floor(Math.random() * (MODULUS - 1));

const nextSeed = (seed: number): number => (seed * MULTIPLIER) % MODULUS;

const isPerPiece = (stage: FinesseStageId): boolean => stage === "cells" || stage === "keys";

const streakOf = (results: ReadonlyArray<Result>): number => {
	const misses = results.map((result, index) => (result.ok ? -1 : index));

	return results.length - Math.max(-1, ...misses) - 1;
};

const windowOf = (results: ReadonlyArray<Result>, size: number): { readonly passes: number; readonly size: number } => {
	const window = results.slice(-size);

	return { passes: window.filter((result) => result.ok).length, size: window.length };
};

type Recorded = Pick<FinesseState, "stage" | "results">;

const pick = <T>(items: ReadonlyArray<T>, fraction: number): T => {
	const item = items[Math.floor(fraction * items.length)];

	if (item === undefined) throw new Error("Nothing to pick from");

	return item;
};

const resultsOf = ({ results }: Recorded, mino: Piece): ReadonlyArray<Result> =>
	results.filter((result) => result.mino === mino);

const isPiecePassed = (state: Recorded, mino: Piece): boolean => {
	const results = resultsOf(state, mino);

	if (state.stage === "cells") return streakOf(results) >= STREAK.cells;

	const { passes, size } = windowOf(results, WINDOWS.keys.size);

	return size === WINDOWS.keys.size && passes >= WINDOWS.keys.passes;
};

export const currentPiece = (state: Recorded): Piece =>
	FINESSE_PIECES.find((mino) => !isPiecePassed(state, mino)) ?? LAST_PIECE;

const draw = (state: Omit<FinesseState, "target">): FinesseState => {
	const seed = nextSeed(state.seed);
	const mino = currentPiece(state);
	const pool = isPerPiece(state.stage) ? FINESSE_TARGETS.filter((target) => target.mino === mino) : FINESSE_TARGETS;

	return { ...state, seed, target: pick(pool, seed / MODULUS) };
};

export const startFinesse = (stage: FinesseStageId, seed = randomSeed()): FinesseState =>
	draw({ stage, seed, results: [] });

export const isFinessePassed = (state: FinesseState): boolean => {
	switch (state.stage) {
		case "cells":
		case "keys":
			return isPiecePassed(state, LAST_PIECE);
		case "mixed":
		case "gravity": {
			const { passes, size } = windowOf(state.results, WINDOWS.mixed.size);

			return size === WINDOWS.mixed.size && passes >= WINDOWS.mixed.passes;
		}
		case "reset":
			return streakOf(state.results) >= STREAK.reset;
	}
};

const progressOf = (state: FinesseState): { readonly label: string; readonly value: string } => {
	const { stage, results } = state;

	if (stage === "reset") return { label: "Run", value: `${streakOf(results)} in a row` };

	if (!isPerPiece(stage)) {
		const { passes, size } = windowOf(results, WINDOWS.mixed.size);

		return { label: "Progress", value: `${passes} of the last ${size}` };
	}

	const mino = currentPiece(state);
	const label = `Progress · ${mino.toUpperCase()}`;

	if (stage === "cells") return { label, value: `${streakOf(resultsOf(state, mino))} in a row` };

	const { passes, size } = windowOf(resultsOf(state, mino), WINDOWS.keys.size);

	return { label, value: `${passes} of the last ${size}` };
};

export const FINESSE_DRILL: Drill<FinesseState, FinesseStage> = {
	stages: FINESSE_STAGES,
	start: (stage) => startFinesse(stage.id),
	deal: (state, player, round) => {
		const next = round === "next" ? draw(state) : state;

		return { game: loadGame(pieceSetup(next.target.mino), player.handling, next.stage === "gravity"), state: next };
	},
	judge: (state, { placement, cells, inputs }, player) => {
		const { target, stage } = state;
		const attempt: Attempt = { target, orientation: placement.orientation, presses: inputs };
		const fault = !samePlacement(placement, targetPlacement(target))
			? wrongSpot(attempt, player)
			: stage === "cells"
				? null
				: findFault(attempt, player);
		const next: FinesseState = {
			...state,
			results: [...state.results, { mino: target.mino, ok: fault === null }],
		};

		if (fault === null) return { verdict: { ok: true }, next };

		return {
			verdict: { ok: false, ...fault, placed: cells, best: targetPlacement(target) },
			next,
		};
	},
	isRoundOver: () => true,
	isPassed: isFinessePassed,
	progress: progressOf,
	marks: ({ target }) => targetMarks(target),
	describe: ({ stage, target }, player) =>
		JSON.stringify({ stage, target, keys: finesseRoutes(target, player)[0] ?? [] }),
	watch: (player) => {
		const target = pick(FINESSE_TARGETS, Math.random());
		const route = finesseRoutes(target, player)[0] ?? [];

		return {
			game: loadGame(pieceSetup(target.mino), DEMO_HANDLING),
			steps: routeScript(route),
			locks: 1,
			marks: targetMarks(target),
			narration: slideTitles(routeRules(target, route)),
		};
	},
};
