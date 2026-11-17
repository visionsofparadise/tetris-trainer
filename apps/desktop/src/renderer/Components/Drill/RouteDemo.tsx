import { useEffect, useMemo, useState } from "react";
import { loadDemo, type Demo } from "../../utils/loadDemo";
import { PlayArea } from "../Board/PlayArea";
import type { AppContext } from "../../models/AppContext";
import type { PauseControl } from "../../models/PauseControl";
import type { ReactNode } from "react";

const READ_MS = 1400;

interface RouteDemoProps {
	readonly demos: ReadonlyArray<Demo>;
	readonly pause: PauseControl;
	readonly children?: ReactNode;
	readonly context: AppContext;
}

export function RouteDemo({ demos, pause, children, context }: RouteDemoProps) {
	const [round, setRound] = useState(0);
	const [placedRound, setPlacedRound] = useState<number | null>(null);
	const demo = demos[round % demos.length];
	const game = useMemo(() => demo && loadDemo(demo), [demo, round]);
	const isPlaced = placedRound === round;
	const { isPaused } = pause;

	useEffect(
		() =>
			game?.on("place", () => {
				game.pause();
				setPlacedRound(round);
			}),
		[game, round],
	);

	useEffect(() => {
		if (!isPlaced || isPaused) return;

		const timeout = setTimeout(() => setRound(round + 1), READ_MS);

		return () => clearTimeout(timeout);
	}, [isPlaced, isPaused, round]);

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
