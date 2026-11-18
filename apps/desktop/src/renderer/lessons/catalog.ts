import { openerLesson } from "./opener/openerLesson";
import { TKI } from "./tki";
import type { LessonGroup } from "../models/Lesson";

export const LESSON_GROUPS: ReadonlyArray<LessonGroup> = [
	{ title: "Openers", lessons: [openerLesson(TKI, [], "tki-3")] },
];
