import { finesseRoutes } from "@tetris-trainer/game";
import { useMemo } from "react";
import { playerOf } from "../../lessons/drill/player";
import { routeScript } from "../../lessons/finesse/routeScript";
import { pieceSetup, targetMarks } from "../../lessons/finesse/targets";
import { BoardNotes } from "../Board/BoardNotes";
import { RouteDemo } from "../Drill/RouteDemo";
import type { FinesseSlide as Slide } from "../../lessons/finesse/slides";
import type { AppContext } from "../../models/AppContext";
import type { BoardNote } from "../../models/BoardNote";
import type { PauseControl } from "../../models/PauseControl";

interface FinesseSlideProps {
	readonly slide: Slide;
	readonly pause: PauseControl;
	readonly context: AppContext;
}

export function FinesseSlide({ slide, pause, context }: FinesseSlideProps) {
	const { allow180 } = playerOf(context.settings.config);

	const demos = useMemo(
		() =>
			slide.demos.map(({ target, route }) => ({
				setup: pieceSetup(target.mino),
				steps: routeScript(route === "minimal" ? (finesseRoutes(target, { allow180 })[0] ?? []) : route),
				marks: targetMarks(target),
			})),
		[slide, allow180],
	);

	const notes = useMemo(
		(): ReadonlyArray<BoardNote> => slide.notes.map((text) => ({ text, tone: "lime", targets: [] })),
		[slide],
	);

	return (
		<RouteDemo key={slide.title} demos={demos} pause={pause} context={context}>
			<BoardNotes notes={notes} />
		</RouteDemo>
	);
}
