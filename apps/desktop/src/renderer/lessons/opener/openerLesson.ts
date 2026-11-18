import { createElement } from "react";
import { OpenerLearn } from "../../Components/Opener/OpenerLearn";
import { OpenerPractice } from "../../Components/Opener/OpenerPractice";
import { OpenerWatch } from "../../Components/Opener/OpenerWatch";
import type { Opener, Slide } from "./Opener";
import type { Lesson } from "../../models/Lesson";

export const openerLesson = (opener: Opener, slides: ReadonlyArray<Slide>, id: string): Lesson => ({
	id,
	title: opener.name,
	sections: [
		{ id: "learn", title: "Learn", render: (screen) => createElement(OpenerLearn, { ...screen, opener, slides }) },
		{ id: "watch", title: "Watch", render: (screen) => createElement(OpenerWatch, { ...screen, opener }) },
		{ id: "practice", title: "Practice", render: (screen) => createElement(OpenerPractice, { ...screen, opener }) },
	],
});
