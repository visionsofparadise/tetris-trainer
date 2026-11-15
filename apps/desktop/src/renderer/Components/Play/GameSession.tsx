import { Game } from "@tetris-trainer/game";
import { useCallback, useState } from "react";
import { useGameKeyboard } from "../../hooks/useGameKeyboard";
import { PlayArea } from "../Board/PlayArea";
import { GameOver } from "./GameOver";
import type { AppContext } from "../../models/AppContext";
import type { PauseControl } from "../../models/PauseControl";

interface GameSessionProps {
	readonly pause: PauseControl;
	readonly onRestart: () => void;
	readonly context: AppContext;
}

export function GameSession({ pause, onRestart, context }: GameSessionProps) {
	const { settings } = context;
	const [game] = useState(() => new Game(settings.config.handling));
	const [isOver, setIsOver] = useState(false);
	const handleGameOver = useCallback(() => setIsOver(true), []);

	useGameKeyboard(game, onRestart, context, pause.isPaused);

	return (
		<PlayArea game={game} context={context} pause={pause} onGameOver={handleGameOver}>
			{isOver && <GameOver onRestart={onRestart} />}
		</PlayArea>
	);
}
