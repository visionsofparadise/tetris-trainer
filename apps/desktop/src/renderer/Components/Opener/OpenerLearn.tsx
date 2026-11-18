import { useCallback, useMemo } from "react";
import { SlideDeck } from "../Lesson/SlideDeck";
import { OpenerSlide } from "./OpenerSlide";
import { SlideBoard } from "./SlideBoard";
import type { Opener, Slide } from "../../lessons/opener/Opener";
import type { BoardNote } from "../../models/BoardNote";
import type { LessonScreenProps } from "../../models/Lesson";
import type { PauseControl } from "../../models/PauseControl";

const BLANK_SLIDE: Slide = { title: "", notes: [], board: [], marks: [] };

const NO_NOTES: ReadonlyArray<BoardNote> = [];

interface OpenerLearnProps extends LessonScreenProps {
	readonly opener: Opener;
	readonly slides: ReadonlyArray<Slide>;
}

export function OpenerLearn({ opener, slides, ...screen }: OpenerLearnProps) {
	const { context } = screen;

	const renderSlide = useCallback(
		(slide: Slide, pause: PauseControl) => (
			<OpenerSlide opener={opener} slide={slide} pause={pause} context={context} />
		),
		[opener, context],
	);

	const empty = useMemo(() => <SlideBoard slide={BLANK_SLIDE} notes={NO_NOTES} context={context} />, [context]);

	return <SlideDeck slides={slides} renderSlide={renderSlide} empty={empty} {...screen} />;
}
