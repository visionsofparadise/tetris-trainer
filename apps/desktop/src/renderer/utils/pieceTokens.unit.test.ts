import { Mino } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { pieceTokens } from "./pieceTokens";

describe("pieceTokens", () => {
	it("turns standalone piece letters into minos", () => {
		expect(pieceTokens("The O and the I's colors.")).toEqual([
			{ text: "The " },
			{ mino: Mino.O },
			{ text: " and the " },
			{ mino: Mino.I },
			{ text: "'s colors." },
		]);
	});

	it("leaves names and hyphenated words as text", () => {
		expect(pieceTokens("SRS is an S-tier rule set.")).toEqual([{ text: "SRS is an S-tier rule set." }]);
	});
});
