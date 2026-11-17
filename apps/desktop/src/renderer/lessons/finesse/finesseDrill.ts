import { finesseRoutes, Game, Mino, samePlacement, type Piece, type PieceTarget } from "@tetris-trainer/game";
import { DEMO_HANDLING } from "../opener/openerScript";
import { findFault, wrongSpot, type Attempt } from "./faults";
import { routeScript } from "./routeScript";
import {
	FINESSE_PIECES,
	FINESSE_TARGETS,
	routeRules,
	RULE_TEXT,
	TARGETS_BY_PIECE,
	targetMarks,
	targetPlacement,
} from "./targets";
import type { Drill, DrillStage, Player } from "../drill/Drill";

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

const resultsOf = ({ results }: FinesseState, mino: Piece): ReadonlyArray<Result> =>
	results.filter((result) => result.mino === mino);

const isPiecePassed = (state: FinesseState, mino: Piece): boolean => {
	const results = resultsOf(state, mino);

	if (state.stage === "cells") return streakOf(results) >= STREAK.cells;

	const { passes, size } = windowOf(results, WINDOWS.keys.size);

	return size === WINDOWS.keys.size && passes >= WINDOWS.keys.passes;
};

export const currentPiece = (state: FinesseState): Piece =>
	FINESSE_PIECES.find((mino) => !isPiecePassed(state, mino)) ?? LAST_PIECE;

const draw = (state: FinesseState): FinesseState => {
	const seed = nextSeed(state.seed);
	const pool = isPerPiece(state.stage) ? (TARGETS_BY_PIECE.get(currentPiece(state)) ?? []) : FINESSE_TARGETS;
	const target = pool[Math.floor((seed / MODULUS) * pool.length)] ?? state.target;

	return { ...state, seed, target };
};

export const startFinesse = (stage: FinesseStageId, seed = randomSeed()): FinesseState =>
	draw({
		stage,
		seed,
		target: FINESSE_TARGETS[0] ?? { mino: Mino.O, orientation: "spawn", column: 0 },
		results: [],
	});

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

const loadTarget = (target: PieceTarget, handling: Player["handling"], hasGravity: boolean): Game => {
	const game = new Game(handling);

	if (!hasGravity) game.setGravity(0);

	game.load({ board: [], validate: false, queue: { pieces: [target.mino], mode: "any" }, holdEnabled: false });

	return game;
};

const randomTarget = (): PieceTarget =>
	FINESSE_TARGETS[Math.floor(Math.random() * FINESSE_TARGETS.length)] ?? {
		mino: Mino.T,
		orientation: "spawn",
		column: 3,
	};

export const FINESSE_DRILL: Drill<FinesseState, FinesseStage> = {
	stages: FINESSE_STAGES,
	start: (stage) => startFinesse(stage.id),
	deal: (state, player, round) => {
		const next = round === "next" ? draw(state) : state;

		return { game: loadTarget(next.target, player.handling, next.stage === "gravity"), state: next };
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
		const target = randomTarget();
		const route = finesseRoutes(target, player)[0] ?? [];

		return {
			game: loadTarget(target, DEMO_HANDLING, false),
			steps: routeScript(route),
			locks: 1,
			marks: targetMarks(target),
			narration: routeRules(target, route).map((rule) => RULE_TEXT[rule]),
		};
	},
};
