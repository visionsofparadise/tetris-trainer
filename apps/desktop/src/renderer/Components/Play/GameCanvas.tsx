import { Application, extend } from "@pixi/react";
import { Graphics } from "pixi.js";
import "pixi.js/unsafe-eval";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../utils/drawGame";
import { GameGraphics } from "./GameGraphics";
import type { Game } from "@tetris-trainer/game";

extend({ Graphics });

interface GameCanvasProps {
	readonly game: Game;
	readonly onGameOver: () => void;
}

export function GameCanvas({ game, onGameOver }: GameCanvasProps) {
	return (
		<Application width={CANVAS_WIDTH} height={CANVAS_HEIGHT} backgroundAlpha={0}>
			<GameGraphics game={game} onGameOver={onGameOver} />
		</Application>
	);
}
