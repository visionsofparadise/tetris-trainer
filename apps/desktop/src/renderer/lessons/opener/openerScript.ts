import {
	DEFAULT_CONFIG,
	dropSteps,
	Game,
	type Handling,
	type Piece,
	type Placement,
	type ScriptStep,
} from "@tetris-trainer/game";
import type { Decision } from "./planner";

export interface ScriptPacing {
	readonly keyWait: number;
	readonly decisionWait: number;
}

export const DEMO_HANDLING: Handling = { ...DEFAULT_CONFIG.handling, sdf: 41 };

export const DEMO_PACING: ScriptPacing = { keyWait: 6, decisionWait: 30 };

const decisionKeys = (decision: Decision): ReadonlyArray<ScriptStep> =>
	decision.kind === "hold" ? [{ tap: "hold" }] : (decision.keys ?? dropSteps(decision.position.placement));

export const planScript = (
	decisions: ReadonlyArray<Decision>,
	{ keyWait, decisionWait }: ScriptPacing,
): Array<ScriptStep> =>
	decisions.flatMap((decision) =>
		decisionKeys(decision).map((step, index) => ({ ...step, wait: index === 0 ? decisionWait : keyWait })),
	);

export const loadOrder = (handling: Handling, order: ReadonlyArray<Piece>): Game => {
	const game = new Game(handling);

	game.load({ board: [], validate: true, queue: { pieces: order, mode: "fresh-bag" }, holdEnabled: true });

	return game;
};

export const loadBoard = (board: ReadonlyArray<Placement>): Game => {
	const game = new Game(DEMO_HANDLING);

	game.load({ board, validate: true, queue: { pieces: [], mode: "any" }, holdEnabled: true });
	game.pause();

	return game;
};
