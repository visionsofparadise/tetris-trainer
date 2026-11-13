import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, findAction, parseTetrioConfig } from "./config";

// Trimmed from a real TETR.IO config export.
const exported = JSON.stringify({
	controls: {
		style: "custom",
		custom: {
			moveLeft: ["ARROWLEFT"],
			moveRight: ["ARROWRIGHT"],
			softDrop: ["ARROWDOWN"],
			hardDrop: ["SPACE"],
			rotateCCW: ["KEYA"],
			rotateCW: ["KEYD"],
			rotate180: ["KEYS"],
			hold: ["ARROWUP"],
			exit: ["ESCAPE"],
			retry: [],
			chat: [],
			menuUp: [],
		},
		sensitivity: 0.5,
	},
	handling: { arr: 0.3, das: 7, dcd: 0, sdf: 40, safelock: true, cancel: false, ihs: "tap", irs: "tap", may20g: true },
	volume: { music: 0 },
	video: { graphics: "minimal" },
});

describe("parseTetrioConfig", () => {
	it("reads handling and bindings from a TETR.IO export", () => {
		const config = parseTetrioConfig(exported);

		expect(config.handling).toEqual({
			arr: 0.3,
			das: 7,
			dcd: 0,
			sdf: 40,
			safelock: true,
			cancel: false,
			ihs: "tap",
			irs: "tap",
			may20g: true,
		});
		expect(config.controls.custom.rotateCCW).toEqual(["KEYA"]);
	});

	it("rejects a file without handling", () => {
		expect(() =>
			parseTetrioConfig(JSON.stringify({ controls: { custom: DEFAULT_CONFIG.controls.custom } })),
		).toThrow();
	});
});

describe("findAction", () => {
	it("matches a browser key code against TETR.IO's upper-cased binding", () => {
		expect(findAction(DEFAULT_CONFIG, "ShiftLeft")).toBe("hold");
	});

	it("returns undefined for an unbound key", () => {
		expect(findAction(DEFAULT_CONFIG, "KeyQ")).toBeUndefined();
	});
});
