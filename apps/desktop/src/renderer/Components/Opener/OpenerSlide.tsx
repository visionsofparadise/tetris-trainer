import { useMemo } from "react";
import { slideNotes } from "../../utils/slideNotes";
import { LearnDemo } from "./LearnDemo";
import { SlideBoard } from "./SlideBoard";
import type { Opener, Slide } from "../../lessons/opener/Opener";
import type { AppContext } from "../../models/AppContext";
import type { PauseControl } from "../../models/PauseControl";

interface OpenerSlideProps {
	readonly opener: Opener;
	readonly slide: Slide;
	readonly pause: PauseControl;
	readonly context: AppContext;
}

export function OpenerSlide({ opener, slide, pause, context }: OpenerSlideProps) {
	const notes = useMemo(() => slideNotes(slide), [slide]);

	return slide.isLive ? (
		<LearnDemo opener={opener} notes={notes} pause={pause} context={context} />
	) : (
		<SlideBoard slide={slide} notes={notes} context={context} />
	);
}
