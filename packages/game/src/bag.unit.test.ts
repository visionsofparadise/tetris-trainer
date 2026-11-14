import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { bagRemainder } from "./bag";
import { BAG } from "./pieces";

const drawn = (...minos: Array<(typeof BAG)[number]>) =>
	minos.map((mino, index) => ({ mino, label: `Piece ${index + 1}` }));

describe("bagRemainder", () => {
	it("returns the pieces the current bag has not drawn yet", () => {
		expect(bagRemainder(drawn(Mino.T, Mino.I)).sort()).toEqual([Mino.J, Mino.L, Mino.O, Mino.S, Mino.Z]);
	});

	it("starts a new bag once all seven pieces are drawn", () => {
		expect(bagRemainder(drawn(...BAG, Mino.T)).sort()).toEqual([Mino.I, Mino.J, Mino.L, Mino.O, Mino.S, Mino.Z]);
	});

	it("names the piece that repeats within its bag", () => {
		expect(() => bagRemainder(drawn(Mino.T, Mino.I, Mino.T))).toThrow(
			"Piece 3 (T) repeats a piece already drawn from its 7-bag",
		);
	});
});
