import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { compileScript } from "./script";

describe("compileScript", () => {
	it("starts each step its wait after the previous step ends", () => {
		const inputs = compileScript(
			[
				{ tap: "moveLeft" },
				{ hold: "softDrop", frames: 5, wait: 3 },
				{ press: "hardDrop" },
				{ release: "hardDrop" },
			],
			DEFAULT_CONFIG.handling,
		);

		expect(inputs.map(({ frame, type, key }) => `${frame} ${type} ${key}`)).toEqual([
			"0 keydown moveLeft",
			"1 keyup moveLeft",
			"5 keydown softDrop",
			"10 keyup softDrop",
			"11 keydown hardDrop",
			"12 keyup hardDrop",
		]);
	});

	it("holds a DAS step long enough to cross the board at the handling's speed", () => {
		const [down, up] = compileScript([{ das: "moveRight" }], { ...DEFAULT_CONFIG.handling, das: 10, arr: 2 });

		expect((up?.frame ?? 0) - (down?.frame ?? 0)).toBe(29);
	});
});
