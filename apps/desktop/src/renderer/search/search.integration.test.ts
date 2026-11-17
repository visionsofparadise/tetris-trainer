import { DEFAULT_CONFIG, Mino, type Game, type GameSetup } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { loadGame } from "../utils/loadDemo";
import { searchStateOf } from "./searchStateOf";

const WELL = 9;

const loadedGame = (board: GameSetup["board"]): Game =>
	loadGame(
		{
			board,
			validate: false,
			queue: { pieces: [Mino.I, Mino.I, Mino.I, Mino.O, Mino.O, Mino.O], mode: "any" },
			holdEnabled: true,
		},
		DEFAULT_CONFIG.handling,
	);

describe("searchStateOf", () => {
	it("reads a loaded game's state", () => {
		const state = searchStateOf(loadedGame([{ column: WELL, amount: 3 }]));

		expect(state.current).toBe(Mino.I);
		expect(state.hold).toBeNull();
		expect(state.holdEnabled).toBe(true);
		expect(state.holdLocked).toBe(false);
		expect(state.queue).toEqual([Mino.I, Mino.I, Mino.O, Mino.O, Mino.O]);
		expect(Array.from(state.board.rows.slice(0, 4))).toEqual([0b0111111111, 0b0111111111, 0b0111111111, 0]);
	});

	it("reads the hold as locked after a hold step", () => {
		const state = searchStateOf(loadedGame([{ hold: Mino.T }]));

		expect(state.hold).toBe(Mino.T);
		expect(state.holdLocked).toBe(true);
	});
});
