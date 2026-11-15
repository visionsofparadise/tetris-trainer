import { describe, expect, it } from "vitest";
import { clearLayers, MAX_STREAK } from "./cueLayers";

const tickPitches = (streak: number, isDifficult = false): Array<number> =>
	clearLayers({ streak, isDifficult }).flatMap((layer) =>
		layer.kind === "tone" && layer.envelope === "beep" ? [layer.frequency] : [],
	);

describe("clearLayers", () => {
	it("raises the clear tick with each clear in a row up to a limit", () => {
		const [first] = tickPitches(0);
		const [second] = tickPitches(1);
		const [capped] = tickPitches(MAX_STREAK);

		expect(second).toBeGreaterThan(first ?? Infinity);
		expect(tickPitches(MAX_STREAK + 5)).toEqual([capped]);
	});

	it("doubles the tick for a back-to-back clear", () => {
		expect(tickPitches(0, true)).toHaveLength(2);
	});
});
