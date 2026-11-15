import { createElement } from "react";
import { OpenerLearn } from "../../Components/Opener/OpenerLearn";
import { OpenerPractice } from "../../Components/Opener/OpenerPractice";
import { OpenerWatch } from "../../Components/Opener/OpenerWatch";
import type { Opener } from "./Opener";
import type { Lesson } from "../../models/Lesson";

export const openerLesson = (opener: Opener, id: string, detail: string): Lesson => ({
	id,
	title: opener.name,
	detail,
	sections: [
		{ id: "learn", title: "Learn", render: (screen) => createElement(OpenerLearn, { ...screen, opener }) },
		{ id: "watch", title: "Watch", render: (screen) => createElement(OpenerWatch, { ...screen, opener }) },
		{ id: "practice", title: "Practice", render: (screen) => createElement(OpenerPractice, { ...screen, opener }) },
	],
});
