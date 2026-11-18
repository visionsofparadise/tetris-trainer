import { COLUMN_WELLS } from "./column-wells/lesson";
import { DROP_CHOICE } from "./drop-choice/lesson";
import { FINESSE } from "./finesse/lesson";
import { NUMBER_ONE } from "./numberOne";
import { openerLesson } from "./opener/openerLesson";
import { PCO } from "./pco";
import { PELICAN } from "./pelican";
import { RELIABLE_TSD } from "./reliableTsd";
import { SPINS } from "./spins/lesson";
import { T_SPINS } from "./t-spins/lesson";
import { TKI } from "./tki";
import { TKI_MIRRORED } from "./tkiMirrored";
import type { LessonGroup } from "../models/Lesson";

export const LESSON_GROUPS: ReadonlyArray<LessonGroup> = [
	{ title: "Fundamentals", lessons: [FINESSE] },
	{ title: "Quads", lessons: [COLUMN_WELLS] },
	{ title: "Moves", lessons: [DROP_CHOICE, T_SPINS, SPINS] },
	{
		title: "Openers",
		lessons: [
			openerLesson(TKI, "tki-3", "A first-bag opener that ends in a T-spin double."),
			openerLesson(TKI_MIRRORED, "tki-3-mirrored", "TKI-3 built the other way round, with the slot on the right."),
			openerLesson(PELICAN, "pelican", "A first-bag platform opener that ends in a T-spin double."),
			openerLesson(RELIABLE_TSD, "reliable-tsd", "A first-bag T-spin double with its slot on the right."),
			openerLesson(NUMBER_ONE, "number-one", "A first-bag platform opener that ends in an upright T-spin double."),
			openerLesson(PCO, "pco", "A first-bag shape that leaves a gap for a perfect clear."),
		],
	},
];
