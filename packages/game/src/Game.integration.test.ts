import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { Game } from "./Game";
import { taps } from "./inputs";
import { SetupError } from "./SetupError";
import type { GameSetup } from "./setup";

const FRAME_MS = 1000 / 60;

const setup = (overrides: Partial<GameSetup>): GameSetup => ({
	board: [],
	validate: true,
	queue: { pieces: [], mode: "fresh-bag" },
	holdEnabled: true,
	seed: 1,
	...overrides,
});

const loaded = (overrides: Partial<GameSetup>): Game => {
	const game = new Game(DEFAULT_CONFIG.handling, 1);

	game.load(setup(overrides));

	return game;
};

const hardDrop = (game: Game): void => {
	game.press("hardDrop");
	game.step();
	game.release("hardDrop");
	game.step();
};

const filledColumns = (game: Game, y: number): Array<number> =>
	(game.board[y] ?? []).flatMap((mino, x) => (mino === null ? [] : [x]));

describe("Game", () => {
	it("locks the falling piece where its ghost shows on a hard drop", () => {
		const game = new Game(DEFAULT_CONFIG.handling, 1);
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

	describe("load", () => {
		it("builds the board in drop order and clears full lines", () => {
			const game = loaded({
				board: [
					{ mino: Mino.I, rotation: 0, x: 0, y: 1 },
					{ mino: Mino.I, rotation: 0, x: 4, y: 1 },
					{ mino: Mino.O, rotation: 0, x: 8, y: 1 },
				],
			});

			expect(filledColumns(game, 0)).toEqual([8, 9]);
			expect(filledColumns(game, 1)).toEqual([]);
		});

		it("rejects a floating piece unless validation is off", () => {
			const floating: GameSetup["board"] = [{ mino: Mino.I, rotation: 0, x: 0, y: 5 }];

			expect(() => loaded({ board: floating })).toThrow(new SetupError("Board item 1 (I) is floating"));
			expect(filledColumns(loaded({ board: floating, validate: false }), 4)).toEqual([0, 1, 2, 3]);
		});

		it("continues the board's bag after the fixed pieces", () => {
			const game = loaded({
				board: [
					{ mino: Mino.I, rotation: 0, x: 0, y: 1 },
					{ mino: Mino.O, rotation: 0, x: 4, y: 1 },
				],
				queue: { pieces: [Mino.T, Mino.S], mode: "continue-bag" },
			});

			expect(game.falling.mino).toBe(Mino.T);
			expect(game.next[0]).toBe(Mino.S);
			expect(game.next.slice(1, 4).sort()).toEqual([Mino.J, Mino.L, Mino.Z]);
		});

		it("checks the queue against the bag only in the bag modes", () => {
			const board: GameSetup["board"] = [{ mino: Mino.I, rotation: 0, x: 0, y: 1 }];

			expect(() => loaded({ board, queue: { pieces: [Mino.I], mode: "continue-bag" } })).toThrow(
				"Queue piece 1 (I)",
			);
			expect(loaded({ board, queue: { pieces: [Mino.I], mode: "fresh-bag" } }).falling.mino).toBe(Mino.I);
			expect(loaded({ queue: { pieces: [Mino.I, Mino.I, Mino.I], mode: "any" } }).next.slice(0, 2)).toEqual([
				Mino.I,
				Mino.I,
			]);
		});

		it("applies the hold setting", () => {
			const game = loaded({
				board: [{ hold: Mino.I }, { mino: Mino.O, rotation: 0, x: 0, y: 1 }],
				queue: { pieces: [Mino.T], mode: "any" },
				holdEnabled: false,
			});

			game.press("hold");
			game.step();

			expect(game.hold).toBe(Mino.I);
			expect(game.falling.mino).toBe(Mino.T);
		});

		it("plays hold steps into the hold, the falling piece and the bag", () => {
			const game = loaded({
				board: [{ hold: Mino.T }, { mino: Mino.I, rotation: 0, x: 0, y: 1 }, { hold: Mino.O }],
				queue: { pieces: [Mino.S], mode: "continue-bag" },
			});

			game.press("hold");
			game.step();

			expect(game.hold).toBe(Mino.O);
			expect(game.falling.mino).toBe(Mino.T);
			expect(game.next[0]).toBe(Mino.S);
			expect(game.next.slice(1, 4).sort()).toEqual([Mino.J, Mino.L, Mino.Z]);
		});

		it("rejects hold steps real play could not make", () => {
			expect(() => loaded({ board: [{ hold: Mino.T }, { hold: Mino.O }] })).toThrow(
				new SetupError("Board item 2 (hold O) holds again before a piece is placed"),
			);
			expect(() =>
				loaded({
					board: [
						{ hold: Mino.T },
						{ mino: Mino.I, rotation: 0, x: 0, y: 1 },
						{ hold: Mino.O },
						{ mino: Mino.I, rotation: 0, x: 4, y: 1 },
					],
				}),
			).toThrow(new SetupError("Board item 4 (I) must place the T that came out of hold"));
		});
	});

	it("restores a snapshot", () => {
		const game = loaded({ queue: { pieces: [Mino.T], mode: "fresh-bag" } });
		const snapshot = game.snapshot();

		hardDrop(game);
		game.restore(snapshot);

		expect(game.board.every((row) => row.every((mino) => mino === null))).toBe(true);
		expect(game.falling.mino).toBe(Mino.T);
		expect(game.stats.pieces).toBe(0);
	});

	it("reports a placement before the next piece spawns", () => {
		const game = loaded({ queue: { pieces: [Mino.T, Mino.I], mode: "fresh-bag" } });
		const events: Array<string> = [];
		const ghost = game.ghost;
		let placed: ReadonlyArray<[number, number]> = [];

		game.on("input", ({ type }) => events.push(type));
		game.on("place", ({ cells }) => {
			events.push("place");
			placed = cells;
		});
		game.on("spawn", ({ mino }) => events.push(`spawn ${mino}`));
		hardDrop(game);

		expect(events).toEqual(["keydown", "place", "spawn i", "keyup"]);
		expect(placed).toEqual(ghost);
	});

	it("plays scripted inputs while the player's input is off", () => {
		const game = loaded({ queue: { pieces: [Mino.T], mode: "fresh-bag" } });
		const spawnLeft = Math.min(...game.falling.blocks.map(([x]) => x));
		let placedLeft = Number.NaN;

		game.on("place", ({ cells }) => (placedLeft = Math.min(...cells.map(([x]) => x))));
		game.setUserInput(false);
		game.press("moveRight");
		game.input(taps(["moveLeft", "hardDrop"], { gapFrames: 2 }));
		game.step(5);

		expect(placedLeft).toBe(spawnLeft - 1);
	});

	it("runs at its set speed and only steps while paused", () => {
		const game = new Game(DEFAULT_CONFIG.handling, 1);

		game.setSpeed(2);
		game.advance(FRAME_MS);
		expect(game.stats.frames).toBe(2);

		game.pause();
		game.advance(FRAME_MS);
		game.step(3);
		expect(game.stats.frames).toBe(5);
	});

	it("adds garbage under the stack and removes it from the bottom", () => {
		const game = loaded({ board: [{ mino: Mino.O, rotation: 0, x: 0, y: 1 }] });

		game.addGarbage({ column: 3, amount: 2 });

		expect(filledColumns(game, 0)).toEqual([0, 1, 2, 4, 5, 6, 7, 8, 9]);
		expect(game.board[2]?.[0]).toBe(Mino.O);
		expect(game.removeGarbage(1)).toBe(1);
		expect(game.board[1]?.[0]).toBe(Mino.O);
		expect(game.board[0]?.[0]).toBe(Mino.GARBAGE);
	});
});
