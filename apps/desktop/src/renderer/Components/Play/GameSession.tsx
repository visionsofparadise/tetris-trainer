import { Game } from "@tetris-trainer/game";
import { useCallback, useState } from "react";
import { useGameKeyboard } from "../../hooks/useGameKeyboard";
import { GameCanvas } from "./GameCanvas";
import { GameOver } from "./GameOver";
import type { AppContext } from "../../models/AppContext";

interface GameSessionProps {
	readonly onRestart: () => void;
	readonly context: AppContext;
}

export function GameSession({ onRestart, context }: GameSessionProps) {
	const { settings } = context;
	const [game] = useState(() => new Game(settings.config.handling));
	const [isOver, setIsOver] = useState(false);
	const handleGameOver = useCallback(() => setIsOver(true), []);

	useGameKeyboard(game, onRestart, context);

	return (
		<>
			<GameCanvas game={game} onGameOver={handleGameOver} />
			{isOver && <GameOver stats={game.stats} onRestart={onRestart} />}
		</>
	);
}
