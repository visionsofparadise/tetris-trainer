import { Mino, type Piece } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { afterHold, afterPlace, startState } from "./planState";

const { I, J, L, O, S, T, Z } = Mino;

const ORDER: ReadonlyArray<Piece> = [I, J, L, O, S, T, Z];

describe("startState", () => {
	it("puts the first piece in hand with nothing held or placed", () => {
		expect(startState(ORDER)).toEqual({
			order: ORDER,
			drawn: 1,
			current: I,
			hold: null,
			holdLocked: false,
			placed: [],
		});
	});
});

describe("afterPlace", () => {
	it("records the piece and draws the next one", () => {
		const state = afterPlace(startState(ORDER), I);

		expect(state.placed).toEqual([I]);
		expect(state.current).toBe(J);
		expect(state.drawn).toBe(2);
	});

	it("draws from the next bag once the order runs out", () => {
		const state = ORDER.reduce(afterPlace, startState(ORDER));

		expect(state.current).toBe("next-bag");
		expect(state.drawn).toBe(ORDER.length);
	});

	it("frees hold again", () => {
		const state = afterPlace(afterHold(startState(ORDER)), J);

		expect(state.holdLocked).toBe(false);
		expect(state.hold).toBe(I);
	});
});

describe("afterHold", () => {
	it("stores the piece in hand and draws the next one when hold is empty", () => {
		const state = afterHold(startState(ORDER));

		expect(state.hold).toBe(I);
		expect(state.current).toBe(J);
		expect(state.drawn).toBe(2);
		expect(state.holdLocked).toBe(true);
	});

	it("swaps the piece in hand with the held piece without drawing", () => {
		const state = afterHold(afterPlace(afterHold(startState(ORDER)), J));

		expect(state.hold).toBe(L);
		expect(state.current).toBe(I);
		expect(state.drawn).toBe(3);
		expect(state.placed).toEqual([J]);
	});
});
