import { findLessonPlace, lessonStart } from "./lessonViews";
import type { LessonGroup } from "../models/Lesson";
import type { View } from "../models/View";

export interface Crumb {
	readonly label: string;
	readonly view: View;
}

const PAGE_CRUMBS: Partial<Record<View, ReadonlyArray<Crumb>>> = {
	"free-play": [{ label: "Free play", view: "free-play" }],
	settings: [{ label: "Settings", view: "settings" }],
};

const lessonCrumbs = (groups: ReadonlyArray<LessonGroup>, view: View): ReadonlyArray<Crumb> => {
	const place = findLessonPlace(groups, view);

	if (!place) return [];

	const { lesson, section } = place;
	const crumbs: Array<Crumb> = [
		{ label: "Lessons", view: "free-play" },
		{ label: lesson.title, view: lessonStart(lesson) },
	];

	return lesson.sections.length > 1 ? [...crumbs, { label: section.title, view }] : crumbs;
};

export const viewCrumbs = (groups: ReadonlyArray<LessonGroup>, view: View): ReadonlyArray<Crumb> =>
	PAGE_CRUMBS[view] ?? lessonCrumbs(groups, view);
