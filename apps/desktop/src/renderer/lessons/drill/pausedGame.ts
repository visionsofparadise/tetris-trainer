import { DEFAULT_CONFIG, Game } from "@tetris-trainer/game";

export const pausedGame = (): Game => {
	const game = new Game(DEFAULT_CONFIG.handling);

	game.pause();

	return game;
};
