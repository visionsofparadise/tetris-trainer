import { Game } from "@tetris-trainer/game";
import { useCallback, useState } from "react";
import { useGameKeyboard } from "../../hooks/useGameKeyboard";
import { GameCanvas } from "./GameCanvas";
import { GameOver } from "./GameOver";
import type { AppContext } from "../../models/AppContext";

interface GameSessionProps {
	readonly onRestart: () => void;
	readonly onExit: () => void;
	readonly context: AppContext;
}

export function GameSession({ onRestart, onExit, context }: GameSessionProps) {
	const { settings } = context;
	const [game] = useState(() => new Game(settings.config.handling));
	const [isOver, setIsOver] = useState(false);
	const handleGameOver = useCallback(() => setIsOver(true), []);

	useGameKeyboard(game, onRestart, onExit, context);

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="relative">
				<GameCanvas game={game} onGameOver={handleGameOver} />
				{isOver && <GameOver stats={game.stats} onRestart={onRestart} onExit={onExit} />}
			</div>
			<div className={isOver ? "invisible flex gap-3" : "flex gap-3"}>
				<button className="button-secondary" type="button" onClick={onRestart}>
					Restart
				</button>
				<button className="button-secondary" type="button" onClick={onExit}>
					Menu
				</button>
			</div>
		</div>
	);
}
