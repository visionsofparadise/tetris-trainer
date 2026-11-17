import { Game, type GameSetup, type ScriptStep } from "@tetris-trainer/game";
import { DEMO_HANDLING } from "../lessons/opener/openerScript";
import type { BoardMark } from "../models/BoardMark";

export interface Demo {
	readonly setup: GameSetup;
	readonly steps: ReadonlyArray<ScriptStep>;
	readonly marks: ReadonlyArray<BoardMark>;
}

export const loadDemo = ({ setup, steps }: Demo): Game => {
	const game = new Game(DEMO_HANDLING);

	game.setGravity(0);
	game.load(setup);
	game.setUserInput(false);
	game.input(steps);

	return game;
};
