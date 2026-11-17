import { createElement, type ReactNode } from "react";
import { DrillPractice } from "../../Components/Drill/DrillPractice";
import { DrillSlides } from "../../Components/Drill/DrillSlides";
import { DrillWatch } from "../../Components/Drill/DrillWatch";
import type { Drill } from "./Drill";
import type { DeckSlide } from "../../Components/Lesson/SlideDeck";
import type { AppContext } from "../../models/AppContext";
import type { Lesson, LessonSection } from "../../models/Lesson";
import type { PauseControl } from "../../models/PauseControl";

export interface DrillLearn<T extends DeckSlide> {
	readonly slides: ReadonlyArray<T>;
	readonly renderSlide: (slide: T, pause: PauseControl, context: AppContext) => ReactNode;
}

interface DrillLessonOptions<S, T extends DeckSlide> {
	readonly id: string;
	readonly title: string;
	readonly detail: string;
	readonly learn?: DrillLearn<T>;
	readonly drill: Drill<S>;
	readonly showNext: boolean;
}

export const drillLesson = <S, T extends DeckSlide>({
	id,
	title,
	detail,
	learn,
	drill,
	showNext,
}: DrillLessonOptions<S, T>): Lesson => {
	const { watch } = drill;
	const learnSections: Array<LessonSection> = learn
		? [{ id: "learn", title: "Learn", render: (screen) => createElement(DrillSlides<T>, { ...screen, learn }) }]
		: [];
	const watchSections: Array<LessonSection> = watch
		? [{ id: "watch", title: "Watch", render: (screen) => createElement(DrillWatch, { ...screen, watch, showNext }) }]
		: [];

	return {
		id,
		title,
		detail,
		sections: [
			...learnSections,
			...watchSections,
			{
				id: "practice",
				title: "Practice",
				render: (screen) => createElement(DrillPractice<S>, { ...screen, drill, showNext }),
			},
		],
	};
};
