import { describe, expect, it } from "vitest";
import { clampVolume, DEFAULT_VOLUME, wheelVolume } from "./volume";

describe("wheelVolume", () => {
	it("raises the volume a step for each wheel notch scrolled up", () => {
		expect(wheelVolume(0.5, -100, 0)).toBe(0.55);
		expect(wheelVolume(0.5, 300, 0)).toBe(0.35);
	});

	it("scales line-mode deltas to the same step", () => {
		expect(wheelVolume(0.5, -2.5, 1)).toBe(0.55);
	});

	it("stays between silent and full", () => {
		expect(wheelVolume(0.98, -100, 0)).toBe(1);
		expect(wheelVolume(0.02, 100, 0)).toBe(0);
	});
});

describe("clampVolume", () => {
	it("falls back to the default for a value that isn't a number", () => {
		expect(clampVolume(Number.NaN)).toBe(DEFAULT_VOLUME);
	});
});
