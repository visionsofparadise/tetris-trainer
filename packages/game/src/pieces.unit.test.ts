import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { placementCells, samePlacement } from "./pieces";

describe("placementCells", () => {
	it("puts the leftmost cell on the column and the lowest cell on the row", () => {
		expect(placementCells({ mino: Mino.L, orientation: "right", column: 0, row: 0 }).sort()).toEqual([
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 0],
		]);
	});
});

describe("samePlacement", () => {
	it("matches orientations that fill the same cells", () => {
		expect(
			samePlacement(
				{ mino: Mino.S, orientation: "right", column: 3, row: 0 },
				{ mino: Mino.S, orientation: "left", column: 3, row: 0 },
			),
		).toBe(true);
		expect(
			samePlacement(
				{ mino: Mino.T, orientation: "right", column: 3, row: 0 },
				{ mino: Mino.T, orientation: "left", column: 3, row: 0 },
			),
		).toBe(false);
	});
});
