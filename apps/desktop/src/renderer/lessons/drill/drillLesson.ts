import { createElement, type ReactNode } from "react";
import { DrillPractice } from "../../Components/Drill/DrillPractice";
import { DrillSlides } from "../../Components/Drill/DrillSlides";
import { DrillWatch } from "../../Components/Drill/DrillWatch";
import type { Drill, DrillStage } from "./Drill";
import type { DeckSlide } from "../../Components/Lesson/SlideDeck";
import type { AppContext } from "../../models/AppContext";
import type { Lesson, LessonSection } from "../../models/Lesson";
import type { PauseControl } from "../../models/PauseControl";

export interface DrillLearn<T extends DeckSlide> {
	readonly slides: ReadonlyArray<T>;
	readonly renderSlide: (slide: T, pause: PauseControl, context: AppContext) => ReactNode;
}

interface DrillLessonOptions<S, T extends DrillStage, Slide extends DeckSlide> {
	readonly id: string;
	readonly title: string;
	readonly detail: string;
	readonly learn?: DrillLearn<Slide>;
	readonly drill: Drill<S, T>;
	readonly showNext: boolean;
}

export const drillLesson = <S, T extends DrillStage, Slide extends DeckSlide>({
	id,
	title,
	detail,
	learn,
	drill,
	showNext,
}: DrillLessonOptions<S, T, Slide>): Lesson => {
	const { watch } = drill;
	const learnSections: Array<LessonSection> = learn
		? [{ id: "learn", title: "Learn", render: (screen) => createElement(DrillSlides<Slide>, { ...screen, learn }) }]
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
				render: (screen) => createElement(DrillPractice<S, T>, { ...screen, drill, showNext }),
			},
		],
	};
};
