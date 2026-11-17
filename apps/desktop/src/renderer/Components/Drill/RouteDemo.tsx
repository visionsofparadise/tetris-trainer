import { useEffect, useState } from "react";
import { loadDemo, type Demo } from "../../utils/loadDemo";
import { PlayArea } from "../Board/PlayArea";
import type { AppContext } from "../../models/AppContext";
import type { PauseControl } from "../../models/PauseControl";
import type { Game } from "@tetris-trainer/game";
import type { ReactNode } from "react";

const READ_MS = 1400;

interface Shown {
	readonly round: number;
	readonly demo: Demo | undefined;
	readonly game: Game | null;
}

const showRound = (demos: ReadonlyArray<Demo>, round: number): Shown => {
	const demo = demos[round % demos.length];

	return { round, demo, game: demo ? loadDemo(demo) : null };
};

interface RouteDemoProps {
	readonly demos: ReadonlyArray<Demo>;
	readonly pause: PauseControl;
	readonly children?: ReactNode;
	readonly context: AppContext;
}

export function RouteDemo({ demos, pause, children, context }: RouteDemoProps) {
	const [shown, setShown] = useState(() => showRound(demos, 0));
	const [placed, setPlaced] = useState<Game | null>(null);
	const { demo, game, round } = shown;
	const isPlaced = game !== null && placed === game;
	const { isPaused } = pause;

	useEffect(
		() =>
			game?.on("place", () => {
				game.pause();
				setPlaced(game);
			}),
		[game],
	);

	useEffect(() => {
		if (!isPlaced || isPaused) return;

		const timeout = setTimeout(() => setShown(showRound(demos, round + 1)), READ_MS);

		return () => clearTimeout(timeout);
	}, [isPlaced, isPaused, demos, round]);

	if (!demo || !game) return null;

	return (
		<PlayArea
			game={game}
			control="demo"
			context={context}
			marks={demo.marks}
			display={isPlaced ? "board" : "play"}
			pause={pause}
			showNext={false}
		>
			{children}
		</PlayArea>
	);
}
