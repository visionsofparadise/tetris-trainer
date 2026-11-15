import { describe, expect, it } from "vitest";
import { START, toward } from "./navigation";

describe("toward", () => {
	it("returns from settings to the screen it was opened from", () => {
		const settings = toward({ view: "tki-practice", back: "tki-practice" }, "settings");

		expect(settings).toEqual({ view: "settings", back: "tki-practice" });
		expect(toward(settings, "settings").view).toBe("tki-practice");
	});

	it("goes straight to any other screen", () => {
		expect(toward(START, "tki-watch")).toEqual({ view: "tki-watch", back: "tki-watch" });
	});
});
