import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { Game } from "./Game";

const hardDrop = (game: Game): void => {
	game.press("hardDrop");
	game.tick();
	game.release("hardDrop");
	game.tick();
};

describe("Game", () => {
	it("locks the falling piece where its ghost shows on a hard drop", () => {
		const game = new Game(DEFAULT_CONFIG.handling, 1);

		game.tick();

		const { mino } = game.falling;
		const ghost = game.ghost;

		hardDrop(game);

		for (const [x, y] of ghost) expect(game.board[y]?.[x]).toBe(mino);
		expect(game.stats.pieces).toBe(1);
	});

	it("ends when the stack tops out", () => {
		const game = new Game(DEFAULT_CONFIG.handling, 1);

		for (let drop = 0; drop < 100 && !game.isOver; drop++) hardDrop(game);

		expect(game.isOver).toBe(true);
	});
});
