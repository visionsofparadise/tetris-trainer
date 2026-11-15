import { describe, expect, it } from "vitest";
import { restoreNavigation, START, toward } from "./navigation";
import type { LessonGroup } from "../models/Lesson";

const PRACTICE = "lesson/tki-3/practice";

const GROUPS: ReadonlyArray<LessonGroup> = [
	{
		title: "Openers",
		lessons: [
			{
				id: "tki-3",
				title: "TKI-3",
				detail: "",
				sections: [{ id: "practice", title: "Practice", render: () => null }],
			},
		],
	},
];

describe("toward", () => {
	it("opens settings from a lesson and closes back to it", () => {
		const settings = toward({ view: PRACTICE, back: PRACTICE }, "settings");

		expect(settings).toEqual({ view: "settings", back: PRACTICE });
		expect(toward(settings, "settings").view).toBe(PRACTICE);
	});

	it("moves straight to any other view", () => {
		expect(toward(START, PRACTICE)).toEqual({ view: PRACTICE, back: PRACTICE });
	});
});

describe("restoreNavigation", () => {
	it("reopens a known view from the address hash", () => {
		expect(restoreNavigation(GROUPS, `#${PRACTICE}`)).toEqual({ view: PRACTICE, back: PRACTICE });
		expect(restoreNavigation(GROUPS, "#settings")).toEqual({ view: "settings", back: "free-play" });
	});

	it("starts at free play for an empty or unknown hash", () => {
		expect(restoreNavigation(GROUPS, "")).toEqual(START);
		expect(restoreNavigation(GROUPS, "#lesson/gone/learn")).toEqual(START);
	});
});
