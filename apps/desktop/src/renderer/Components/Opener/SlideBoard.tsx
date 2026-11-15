import { useMemo } from "react";
import { loadSlide } from "../../lessons/opener/openerScript";
import { slideMarks } from "../../utils/slideNotes";
import { BoardNotes } from "../Board/BoardNotes";
import { PlayArea } from "../Board/PlayArea";
import type { Slide } from "../../lessons/opener/Opener";
import type { AppContext } from "../../models/AppContext";
import type { BoardNote } from "../../models/BoardNote";

interface SlideBoardProps {
	readonly slide: Slide;
	readonly notes: ReadonlyArray<BoardNote>;
	readonly context: AppContext;
}

export function SlideBoard({ slide, notes, context }: SlideBoardProps) {
	const game = useMemo(() => loadSlide(slide), [slide]);
	const marks = useMemo(() => slideMarks(slide), [slide]);

	return (
		<PlayArea game={game} context={context} marks={marks} display={slide.queue ? "play" : "board"}>
			<BoardNotes key={slide.title} notes={notes} />
		</PlayArea>
	);
}
