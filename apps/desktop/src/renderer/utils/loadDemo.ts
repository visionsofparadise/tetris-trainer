import { Game, type GameSetup, type Handling, type ScriptStep } from "@tetris-trainer/game";
import { DEMO_HANDLING } from "../lessons/opener/openerScript";
import type { BoardMark } from "../models/BoardMark";

export interface Demo {
	readonly setup: GameSetup;
	readonly steps: ReadonlyArray<ScriptStep>;
	readonly marks: ReadonlyArray<BoardMark>;
}

export const loadGame = (setup: GameSetup, handling: Handling, hasGravity = false): Game => {
	const game = new Game(handling);

	if (!hasGravity) game.setGravity(0);

	game.load(setup);

	return game;
};

export const loadDemo = ({ setup, steps }: Demo): Game => {
	const game = loadGame(setup, DEMO_HANDLING);

	game.setUserInput(false);
	game.input(steps);

	return game;
};
