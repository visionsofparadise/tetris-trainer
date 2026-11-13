import { useApplication, useTick } from "@pixi/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { drawGame } from "../../utils/drawGame";
import { layoutFor, type Size } from "../../utils/gameLayout";
import { PanelLabel } from "./PanelLabel";
import type { Game } from "@tetris-trainer/game";
import type { Graphics, Ticker } from "pixi.js";

const FRAME_MS = 1000 / 60;

interface GameGraphicsProps {
	readonly game: Game;
	readonly onGameOver: () => void;
}

export function GameGraphics({ game, onGameOver }: GameGraphicsProps) {
	const { app } = useApplication();
	const graphicsRef = useRef<Graphics>(null);
	const unplayedMs = useRef(0);
	const [screen, setScreen] = useState<Size>(() => ({ width: app.screen.width, height: app.screen.height }));
	const layout = useMemo(() => layoutFor(screen), [screen]);
	const draw = useCallback((graphics: Graphics) => drawGame(graphics, game, layout), [game, layout]);

	useEffect(() => {
		const handleResize = (width: number, height: number) => setScreen({ width, height });

		app.renderer.on("resize", handleResize);

		return () => {
			app.renderer.off("resize", handleResize);
		};
	}, [app]);

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

	return (
		<>
			<pixiGraphics ref={graphicsRef} draw={draw} />
			<PanelLabel text="HOLD" left={layout.holdLeft} top={layout.boardTop} cellSize={layout.cellSize} />
			<PanelLabel text="NEXT" left={layout.nextLeft} top={layout.boardTop} cellSize={layout.cellSize} />
		</>
	);
}
