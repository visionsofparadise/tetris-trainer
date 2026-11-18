import { describe, expect, it } from "vitest";
import { createSettings } from "../../models/Settings";
import { playerOf } from "./player";

describe("playerOf", () => {
	it("copies the handling out of the tracked settings, so the worker can clone it", () => {
		const settings = createSettings(null, () => {});

		expect(() => structuredClone(playerOf(settings.config))).not.toThrow();
	});
});
