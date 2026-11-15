import type { View } from "../models/View";

interface LessonSection {
	readonly view: View;
	readonly title: string;
}

interface Lesson {
	readonly title: string;
	readonly detail: string;
	readonly sections: ReadonlyArray<LessonSection>;
}

interface LessonGroup {
	readonly title: string;
	readonly lessons: ReadonlyArray<Lesson>;
}

export const TKI_SECTIONS: ReadonlyArray<LessonSection> = [
	{ view: "tki-learn", title: "Learn" },
	{ view: "tki-watch", title: "Watch" },
	{ view: "tki-practice", title: "Practice" },
];

export const LESSON_GROUPS: ReadonlyArray<LessonGroup> = [
	{
		title: "Openers",
		lessons: [{ title: "TKI-3", detail: "A first-bag opener that ends in a T-spin double.", sections: TKI_SECTIONS }],
	},
];
