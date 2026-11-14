import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { finesseSteps } from "./finesse";

describe("finesseSteps", () => {
	it("taps when the target is near the spawn column", () => {
		expect(finesseSteps({ mino: Mino.T, orientation: "spawn", column: 2 })).toEqual([{ tap: "moveLeft" }]);
	});

	it("uses DAS to reach the wall and taps back from it", () => {
		expect(finesseSteps({ mino: Mino.T, orientation: "spawn", column: 6 })).toEqual([
			{ das: "moveRight" },
			{ tap: "moveLeft" },
		]);
	});

	it("rotates first so DAS stops against the rotated piece's edge", () => {
		expect(finesseSteps({ mino: Mino.I, orientation: "right", column: 9 })).toEqual([
			{ tap: "rotateCW" },
			{ das: "moveRight" },
		]);
	});

	it("picks whichever equivalent orientation needs fewer keys", () => {
		expect(finesseSteps({ mino: Mino.S, orientation: "left", column: 0 })).toEqual([
			{ tap: "rotateCW" },
			{ das: "moveLeft" },
		]);
	});
});
