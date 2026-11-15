import { Mino } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { pieceTokens } from "./pieceTokens";

describe("pieceTokens", () => {
	it("turns standalone piece letters into minos", () => {
		expect(pieceTokens("Lay the Z on the I's left end.")).toEqual([
			{ text: "Lay the " },
			{ mino: Mino.Z },
			{ text: " on the " },
			{ mino: Mino.I },
			{ text: "'s left end." },
		]);
	});

	it("leaves names and T-spins as text", () => {
		expect(pieceTokens("TKI ends in a T-spin double.")).toEqual([{ text: "TKI ends in a T-spin double." }]);
	});
});
