import { isKnownView } from "./lessonViews";
import type { LessonGroup } from "../models/Lesson";
import type { View } from "../models/View";

export interface Navigation {
	readonly view: View;
	readonly back: View;
}

export const START: Navigation = { view: "free-play", back: "free-play" };

export const toward = ({ view, back }: Navigation, next: View): Navigation => {
	if (next !== "settings") return { view: next, back: next };

	return view === "settings" ? { view: back, back } : { view: next, back: view };
};

export const restoreNavigation = (groups: ReadonlyArray<LessonGroup>, hash: string): Navigation => {
	const view = hash.replace(/^#/, "");

	if (!isKnownView(groups, view)) return START;

	return view === "settings" ? toward(START, view) : { view, back: view };
};
