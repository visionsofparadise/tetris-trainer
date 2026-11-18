import { COLUMN_WELLS } from "./column-wells/lesson";
import { FINESSE } from "./finesse/lesson";
import { openerLesson } from "./opener/openerLesson";
import { TKI } from "./tki";
import type { LessonGroup } from "../models/Lesson";

export const LESSON_GROUPS: ReadonlyArray<LessonGroup> = [
	{ title: "Fundamentals", lessons: [FINESSE] },
	{ title: "Quads", lessons: [COLUMN_WELLS] },
	{ title: "Openers", lessons: [openerLesson(TKI, "tki-3", "A first-bag opener that ends in a T-spin double.")] },
];
