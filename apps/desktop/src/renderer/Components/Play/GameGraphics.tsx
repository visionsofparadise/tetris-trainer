import { useTick } from "@pixi/react";
import { useCallback, useRef } from "react";
import { drawGame } from "../../utils/drawGame";
import type { Game } from "@tetris-trainer/game";
import type { Graphics, Ticker } from "pixi.js";

const FRAME_MS = 1000 / 60;

interface GameGraphicsProps {
	readonly game: Game;
	readonly onGameOver: () => void;
}

export function GameGraphics({ game, onGameOver }: GameGraphicsProps) {
	const graphicsRef = useRef<Graphics>(null);
	const unplayedMs = useRef(0);
	const draw = useCallback((graphics: Graphics) => drawGame(graphics, game), [game]);

	const update = useCallback(
		(ticker: Ticker) => {
			unplayedMs.current += ticker.deltaMS;

			while (unplayedMs.current >= FRAME_MS) {
				game.tick();
				unplayedMs.current -= FRAME_MS;
			}

			if (graphicsRef.current) draw(graphicsRef.current);

			if (game.isOver) onGameOver();
		},
		[game, draw, onGameOver],
	);

	useTick(update);

	return <pixiGraphics ref={graphicsRef} draw={draw} />;
}
