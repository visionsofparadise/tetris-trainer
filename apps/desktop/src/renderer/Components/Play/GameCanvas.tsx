import { Application, extend } from "@pixi/react";
import { Graphics, Text } from "pixi.js";
import "pixi.js/unsafe-eval";
import { useCallback, useRef, useState } from "react";
import { GameGraphics } from "./GameGraphics";
import type { BoardMark } from "../../models/BoardMark";
import type { GameDisplay } from "../../models/GameDisplay";
import type { Game } from "@tetris-trainer/game";

extend({ Graphics, Text });

const NO_MARKS: ReadonlyArray<BoardMark> = [];

interface GameCanvasProps {
	readonly game: Game;
	readonly marks?: ReadonlyArray<BoardMark>;
	readonly display?: GameDisplay;
	readonly onGameOver?: () => void;
}

export function GameCanvas({ game, marks = NO_MARKS, display = "play", onGameOver }: GameCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isReady, setIsReady] = useState(false);
	const handleInit = useCallback(() => setIsReady(true), []);

	return (
		<div ref={containerRef} className="absolute inset-0">
			<Application resizeTo={containerRef} backgroundAlpha={0} onInit={handleInit}>
				{isReady && <GameGraphics game={game} marks={marks} display={display} onGameOver={onGameOver} />}
			</Application>
		</div>
	);
}
