import { useCallback } from "react";
import { SlideDeck } from "../Lesson/SlideDeck";
import { OpenerSlide } from "./OpenerSlide";
import type { Opener, Slide } from "../../lessons/opener/Opener";
import type { LessonScreenProps } from "../../models/Lesson";
import type { PauseControl } from "../../models/PauseControl";

interface OpenerLearnProps extends LessonScreenProps {
	readonly opener: Opener;
}

export function OpenerLearn({ opener, ...screen }: OpenerLearnProps) {
	const { context } = screen;

	const renderSlide = useCallback(
		(slide: Slide, pause: PauseControl) => (
			<OpenerSlide opener={opener} slide={slide} pause={pause} context={context} />
		),
		[opener, context],
	);

	return <SlideDeck slides={opener.slides} renderSlide={renderSlide} {...screen} />;
}
