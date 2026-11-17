import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { Game } from "./Game";
import { pressesToSteps, type KeyPress } from "./inputs";
import { SetupError } from "./SetupError";
import type { PlaceEvent } from "./events";
import type { GameKey } from "./script";
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

const holdKey = (game: Game, key: GameKey, frames: number): void => {
	game.press(key);
	game.step(frames);
	game.release(key);
	game.step();
};

const placed = (game: Game): Array<PlaceEvent> => {
	const events: Array<PlaceEvent> = [];

	game.on("place", (event) => events.push(event));

	return events;
};

const press = (key: GameKey, down: number, up: number, blocked = false, carried = false): KeyPress => ({
	key,
	source: "user",
	down,
	up,
	blocked,
	carried,
});

const filledColumns = (game: Game, y: number): Array<number> =>
	(game.board[y] ?? []).flatMap((mino, x) => (mino === null ? [] : [x]));

describe("spawning", () => {
	it("shows a new piece on the row it falls to in play", () => {
		const game = new Game(DEFAULT_CONFIG.handling, 1);
		const topRow = (): number => Math.max(...game.falling.blocks.map(([, y]) => y));
		const atSpawn = topRow();

		game.step(2);

		expect(atSpawn).toBe(21);
		expect(topRow()).toBe(atSpawn);
	});
});

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
					{ mino: Mino.I, orientation: "spawn", column: 0, row: 0 },
					{ mino: Mino.I, orientation: "spawn", column: 4, row: 0 },
					{ mino: Mino.O, orientation: "spawn", column: 8, row: 0 },
				],
			});

			expect(filledColumns(game, 0)).toEqual([8, 9]);
			expect(filledColumns(game, 1)).toEqual([]);
		});

		it("rejects a floating piece unless validation is off", () => {
			const floating: GameSetup["board"] = [{ mino: Mino.I, orientation: "spawn", column: 0, row: 4 }];

			expect(() => loaded({ board: floating })).toThrow(new SetupError("Board item 1 (I) is floating"));
			expect(filledColumns(loaded({ board: floating, validate: false }), 4)).toEqual([0, 1, 2, 3]);
		});

		it("continues the board's bag after the fixed pieces", () => {
			const game = loaded({
				board: [
					{ mino: Mino.I, orientation: "spawn", column: 0, row: 0 },
					{ mino: Mino.O, orientation: "spawn", column: 4, row: 0 },
				],
				queue: { pieces: [Mino.T, Mino.S], mode: "continue-bag" },
			});

			expect(game.falling.mino).toBe(Mino.T);
			expect(game.next[0]).toBe(Mino.S);
			expect(game.next.slice(1, 4).sort()).toEqual([Mino.J, Mino.L, Mino.Z]);
		});

		it("checks the queue against the bag only in the bag modes", () => {
			const board: GameSetup["board"] = [{ mino: Mino.I, orientation: "spawn", column: 0, row: 0 }];

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
				board: [{ hold: Mino.I }, { mino: Mino.O, orientation: "spawn", column: 0, row: 0 }],
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
				board: [{ hold: Mino.T }, { mino: Mino.I, orientation: "spawn", column: 0, row: 0 }, { hold: Mino.O }],
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
						{ mino: Mino.I, orientation: "spawn", column: 0, row: 0 },
						{ hold: Mino.O },
						{ mino: Mino.I, orientation: "spawn", column: 4, row: 0 },
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
		game.input([{ tap: "moveLeft" }, { tap: "hardDrop" }]);
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

	it("stops advancing at the tick that pauses it", () => {
		const game = loaded({ queue: { pieces: [Mino.T, Mino.I], mode: "fresh-bag" } });
		let lockFrame = Number.NaN;

		game.on("place", () => {
			lockFrame = game.stats.frames;
			game.pause();
		});
		game.input([{ tap: "hardDrop" }]);
		game.advance(FRAME_MS * 10);
		game.resume();
		game.advance(FRAME_MS / 2);

		expect(lockFrame).toBe(0);
		expect(game.stats.frames).toBe(1);
	});

	it("adds garbage under the stack and removes it from the bottom", () => {
		const game = loaded({ board: [{ mino: Mino.O, orientation: "spawn", column: 0, row: 0 }] });

		game.addGarbage({ column: 3, amount: 2 });

		expect(filledColumns(game, 0)).toEqual([0, 1, 2, 4, 5, 6, 7, 8, 9]);
		expect(game.board[2]?.[0]).toBe(Mino.O);
		expect(game.removeGarbage(1)).toBe(1);
		expect(game.board[1]?.[0]).toBe(Mino.O);
		expect(game.board[0]?.[0]).toBe(Mino.GARBAGE);
	});
});

describe("tiles", () => {
	it("keeps touching pieces of the same type distinct", () => {
		const game = loaded({
			board: [
				{ mino: Mino.O, orientation: "spawn", column: 0, row: 0 },
				{ mino: Mino.O, orientation: "spawn", column: 2, row: 0 },
			],
			queue: { pieces: [Mino.O, Mino.O], mode: "any" },
		});

		hardDrop(game);
		hardDrop(game);

		expect(game.tiles[0]?.[1]?.edges).toMatchObject({ right: true, top: false });
		expect(game.tiles[0]?.[2]?.edges).toMatchObject({ left: true });
		expect(game.tiles[1]?.[4]?.edges).toMatchObject({ top: true, bottom: false });
		expect(game.tiles[2]?.[4]?.edges).toMatchObject({ bottom: true });
	});
});

describe("key timings", () => {
	const tPiece = (): Game => loaded({ queue: { pieces: [Mino.T, Mino.I], mode: "fresh-bag" } });

	it("reports each press of a piece with its frames, steps and blocked shifts", () => {
		const game = tPiece();
		const places = placed(game);

		holdKey(game, "moveRight", 1);
		holdKey(game, "moveLeft", 20);
		holdKey(game, "rotateCW", 1);
		game.press("moveRight");
		game.step(25);
		hardDrop(game);

		const [place] = places;

		expect(place?.placement).toEqual({ mino: Mino.T, orientation: "right", column: 8, row: 0 });
		expect(place?.inputs).toEqual([
			press("moveRight", 0, 1),
			press("moveLeft", 2, 22, true),
			press("rotateCW", 23, 24),
			press("moveRight", 25, 50, true),
			press("hardDrop", 50, 50),
		]);
		expect(pressesToSteps(place?.inputs ?? [], DEFAULT_CONFIG.handling)).toEqual([
			{ tap: "moveRight" },
			{ das: "moveLeft" },
			{ tap: "rotateCW" },
			{ das: "moveRight" },
		]);
	});

	it("lands T right at column 0 when CW is pressed while DAS left is held", () => {
		const game = tPiece();
		const places = placed(game);

		game.press("moveLeft");
		game.step(20);
		holdKey(game, "rotateCW", 1);
		game.step(5);
		hardDrop(game);

		const [place] = places;

		expect(place?.placement).toEqual({ mino: Mino.T, orientation: "right", column: 0, row: 0 });
		expect(place?.inputs).toEqual([
			press("moveLeft", 0, 27, true),
			press("rotateCW", 20, 21),
			press("hardDrop", 27, 27),
		]);
	});

	it("marks a shift blocked when it held the piece at the wall before a turn moved it off", () => {
		const game = new Game({ ...DEFAULT_CONFIG.handling, dcd: 3 }, 1);
		const places = placed(game);

		game.load(setup({ queue: { pieces: [Mino.T], mode: "any" } }));
		game.press("moveLeft");
		game.step(32);
		game.press("rotateCW");
		game.step();
		game.release("moveLeft");
		game.release("rotateCW");
		game.step();
		hardDrop(game);

		const [place] = places;

		expect(place?.placement).toEqual({ mino: Mino.T, orientation: "right", column: 1, row: 0 });
		expect(place?.inputs).toEqual([
			press("moveLeft", 0, 33, true),
			press("rotateCW", 32, 33),
			press("hardDrop", 34, 34),
		]);
	});

	it("judges a shift held at lock against the board before the lock clears lines", () => {
		const game = loaded({
			board: [
				{ mino: Mino.I, orientation: "spawn", column: 0, row: 0 },
				{ mino: Mino.I, orientation: "spawn", column: 4, row: 0 },
			],
			queue: { pieces: [Mino.O], mode: "any" },
		});
		const places = placed(game);

		game.setGravity(20);
		holdKey(game, "moveRight", 16);
		game.press("moveLeft");
		game.step(2);
		hardDrop(game);

		const [place] = places;

		expect(place?.placement).toEqual({ mino: Mino.O, orientation: "spawn", column: 8, row: 0 });
		expect(place?.lines).toBe(1);
		expect(place?.inputs).toEqual([
			press("moveRight", 0, 16, true),
			press("moveLeft", 17, 19, true),
			press("hardDrop", 19, 19),
		]);
	});

	it("gives a key pressed in the hard drop's tick to the locking piece, and one pressed after it to the next", () => {
		const game = tPiece();
		const places = placed(game);

		game.press("moveLeft");
		game.press("hardDrop");
		game.press("rotateCW");
		game.step();
		game.release("moveLeft");
		game.release("hardDrop");
		game.release("rotateCW");
		game.step();
		hardDrop(game);

		const [first, second] = places;

		expect(first?.placement.column).toBe(2);
		expect(first?.inputs).toEqual([press("moveLeft", 0, 0), press("hardDrop", 0, 0)]);
		expect(second?.inputs).toEqual([press("rotateCW", 0, 1), press("hardDrop", 2, 2)]);
	});

	it("carries a charged DAS held through a lock to the next piece, and no other held key", () => {
		const game = tPiece();
		const places = placed(game);

		game.press("moveLeft");
		game.press("rotateCW");
		game.step(20);
		hardDrop(game);
		game.release("moveLeft");
		game.release("rotateCW");
		game.step();
		hardDrop(game);

		const [first, second] = places;

		expect(first?.inputs).toEqual([
			press("moveLeft", 0, 20, true),
			press("rotateCW", 0, 20),
			press("hardDrop", 20, 20),
		]);
		expect(second?.inputs).toEqual([press("moveLeft", 0, 2, false, true), press("hardDrop", 3, 3)]);
	});

	it("keeps the hard drop's keyup out of the next piece's record", () => {
		const game = tPiece();
		const places = placed(game);

		hardDrop(game);
		hardDrop(game);

		expect(places[1]?.inputs).toEqual([press("hardDrop", 2, 2)]);
	});

	it("starts a clean record after a restore", () => {
		const game = tPiece();
		const places = placed(game);
		const snapshot = game.snapshot();

		game.press("moveLeft");
		game.step(3);
		game.restore(snapshot);
		game.release("moveLeft");
		hardDrop(game);

		expect(places[0]?.inputs).toEqual([press("hardDrop", 0, 0)]);
		expect(places[0]?.placement.column).toBe(3);
	});
});
