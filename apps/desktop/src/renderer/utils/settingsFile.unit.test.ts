import { DEFAULT_CONFIG } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { parseSettings, serializeSettings } from "./settingsFile";
import { DEFAULT_VOLUME } from "./volume";

describe("settings file", () => {
	it("reads back what it wrote", () => {
		const settings = {
			config: { ...DEFAULT_CONFIG, handling: { ...DEFAULT_CONFIG.handling, das: 7, arr: 0.3 } },
			configName: "config.ttc",
			volume: 0.35,
		};

		expect(parseSettings(serializeSettings(settings))).toEqual(settings);
	});

	it("falls back to defaults for a missing or damaged file", () => {
		const defaults = { config: DEFAULT_CONFIG, configName: null, volume: DEFAULT_VOLUME };

		expect(parseSettings(null)).toEqual(defaults);
		expect(parseSettings("{not json")).toEqual(defaults);
		expect(parseSettings('{"config":{"handling":1},"volume":"loud"}')).toEqual(defaults);
	});
});
