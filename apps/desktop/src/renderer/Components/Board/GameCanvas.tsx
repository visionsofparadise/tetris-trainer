import { Application, extend } from "@pixi/react";
import { Graphics, type Application as PixiApplication } from "pixi.js";
import "pixi.js/unsafe-eval";
import { useEffect, useRef, useState } from "react";
import { GameGraphics } from "./GameGraphics";
import type { BoardMark } from "../../models/BoardMark";
import type { GameDisplay } from "../../models/GameDisplay";
import type { Game } from "@tetris-trainer/game";

extend({ Graphics });

const NO_MARKS: ReadonlyArray<BoardMark> = [];

interface GameCanvasProps {
	readonly game: Game;
	readonly marks?: ReadonlyArray<BoardMark>;
	readonly display?: GameDisplay;
	readonly isPaused?: boolean;
	readonly onGameOver?: () => void;
}

export function GameCanvas({
	game,
	marks = NO_MARKS,
	display = "play",
	isPaused = false,
	onGameOver,
}: GameCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [app, setApp] = useState<PixiApplication | null>(null);

	useEffect(() => {
		const container = containerRef.current;

		if (!app || !container) return;

		const observer = new ResizeObserver(() => app.resize());

		observer.observe(container);

		return () => observer.disconnect();
	}, [app]);

	return (
		<div ref={containerRef} className="absolute inset-x-0 bottom-0 h-(--canvas-height) overflow-hidden">
			<Application resizeTo={containerRef} backgroundAlpha={0} onInit={setApp}>
				{app && (
					<GameGraphics game={game} marks={marks} display={display} isPaused={isPaused} onGameOver={onGameOver} />
				)}
			</Application>
		</div>
	);
}
