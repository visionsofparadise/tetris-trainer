import { useMemo } from "react";
import { slideNotes } from "../../utils/slideNotes";
import { SlideBoard } from "../Opener/SlideBoard";
import type { Slide } from "../../lessons/opener/Opener";
import type { AppContext } from "../../models/AppContext";

interface BoardSlideProps {
	readonly slide: Slide;
	readonly context: AppContext;
}

export function BoardSlide({ slide, context }: BoardSlideProps) {
	const notes = useMemo(() => slideNotes(slide), [slide]);

	return <SlideBoard slide={slide} notes={notes} context={context} />;
}
