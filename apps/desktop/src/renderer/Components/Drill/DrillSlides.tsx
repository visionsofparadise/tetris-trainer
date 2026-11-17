import { useCallback } from "react";
import { SlideDeck, type DeckSlide } from "../Lesson/SlideDeck";
import type { DrillLearn } from "../../lessons/drill/drillLesson";
import type { LessonScreenProps } from "../../models/Lesson";
import type { PauseControl } from "../../models/PauseControl";

interface DrillSlidesProps<T extends DeckSlide> extends LessonScreenProps {
	readonly learn: DrillLearn<T>;
}

export function DrillSlides<T extends DeckSlide>({ learn, ...screen }: DrillSlidesProps<T>) {
	const { context } = screen;
	const { slides, renderSlide } = learn;

	const renderDeckSlide = useCallback(
		(slide: T, pause: PauseControl) => renderSlide(slide, pause, context),
		[renderSlide, context],
	);

	return <SlideDeck slides={slides} renderSlide={renderDeckSlide} {...screen} />;
}
