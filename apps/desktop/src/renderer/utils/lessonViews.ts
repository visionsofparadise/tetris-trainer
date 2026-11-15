import type { Lesson, LessonGroup, LessonSection } from "../models/Lesson";
import type { LessonView, View } from "../models/View";

export interface LessonPlace {
	readonly lesson: Lesson;
	readonly section: LessonSection;
}

export const lessonView = (lesson: Pick<Lesson, "id">, section: Pick<LessonSection, "id">): LessonView =>
	`lesson/${lesson.id}/${section.id}`;

export const lessonStart = (lesson: Lesson): View => {
	const [first] = lesson.sections;

	return first ? lessonView(lesson, first) : "free-play";
};

export const findLessonPlace = (groups: ReadonlyArray<LessonGroup>, view: string): LessonPlace | null => {
	for (const { lessons } of groups)
		for (const lesson of lessons)
			for (const section of lesson.sections) if (lessonView(lesson, section) === view) return { lesson, section };

	return null;
};

export const isKnownView = (groups: ReadonlyArray<LessonGroup>, view: string): view is View =>
	view === "free-play" || view === "settings" || findLessonPlace(groups, view) !== null;
