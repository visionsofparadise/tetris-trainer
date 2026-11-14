import { Application, extend } from "@pixi/react";
import { Graphics, Text } from "pixi.js";
import "pixi.js/unsafe-eval";
import { useRef } from "react";
import { GameGraphics } from "./GameGraphics";
import type { Game } from "@tetris-trainer/game";

extend({ Graphics, Text });

interface GameCanvasProps {
	readonly game: Game;
	readonly onGameOver?: () => void;
}

export function GameCanvas({ game, onGameOver }: GameCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<div ref={containerRef} className="absolute inset-0">
			<Application resizeTo={containerRef} backgroundAlpha={0}>
				<GameGraphics game={game} onGameOver={onGameOver} />
			</Application>
		</div>
	);
}
