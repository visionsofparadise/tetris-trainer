import { BAG, DEFAULT_CONFIG, LIVE_BUDGET, Mino, type Game, type MoveRules } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { loadGame } from "../utils/loadDemo";
import { createLocalSearch } from "./localSearch";
import { searchStateOf } from "./searchStateOf";

const WELL = 9;

const RULES: MoveRules = {
	allow180: true,
	excluded: Object.fromEntries(BAG.filter((mino) => mino !== Mino.I).map((mino) => [mino, [WELL]])),
	holeFreeOnly: true,
	ceiling: null,
	quadClearsOnly: true,
};

const loadedGame = (): Game =>
	loadGame(
		{
			board: [{ column: WELL, amount: 3 }],
			validate: false,
			queue: { pieces: [Mino.I, Mino.I, Mino.I, Mino.O, Mino.O, Mino.O], mode: "any" },
			holdEnabled: true,
		},
		DEFAULT_CONFIG.handling,
	);

describe("search clients", () => {
	it("reads a loaded game's state", () => {
		const state = searchStateOf(loadedGame());

		expect(state.current).toBe(Mino.I);
		expect(state.hold).toBeNull();
		expect(state.holdEnabled).toBe(true);
		expect(state.queue).toEqual([Mino.I, Mino.I, Mino.O, Mino.O, Mino.O]);
		expect(Array.from(state.board.rows.slice(0, 4))).toEqual([0b0111111111, 0b0111111111, 0b0111111111, 0]);
	});

	it("resolves a quad-ready search on the game's state", async () => {
		const result = await createLocalSearch().quadReady(
			searchStateOf(loadedGame()),
			{ well: WELL },
			RULES,
			{ handling: DEFAULT_CONFIG.handling, gravity: 0 },
			LIVE_BUDGET,
		);

		expect(result.kind === "reached" && result.locks).toBe(3);
	});
});
