import { Game, type GameSetup, type ScriptStep } from "@tetris-trainer/game";
import { useEffect, useMemo, useState } from "react";
import { DEMO_HANDLING } from "../../lessons/opener/openerScript";
import { PlayArea } from "../Board/PlayArea";
import type { AppContext } from "../../models/AppContext";
import type { BoardMark } from "../../models/BoardMark";
import type { PauseControl } from "../../models/PauseControl";
import type { ReactNode } from "react";

const READ_MS = 1400;

interface Demo {
	readonly setup: GameSetup;
	readonly steps: ReadonlyArray<ScriptStep>;
	readonly marks: ReadonlyArray<BoardMark>;
}

const loadDemo = ({ setup, steps }: Demo): Game => {
	const game = new Game(DEMO_HANDLING);

	game.setGravity(0);
	game.load(setup);
	game.setUserInput(false);
	game.input(steps);

	return game;
};

interface RouteDemoProps {
	readonly demos: ReadonlyArray<Demo>;
	readonly context: AppContext;
	readonly pause: PauseControl;
	readonly children?: ReactNode;
}

export function RouteDemo({ demos, context, pause, children }: RouteDemoProps) {
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
