import { useApplication, useTick } from "@pixi/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { drawGame } from "../../utils/drawGame";
import { layoutFor, type Size } from "../../utils/gameLayout";
import { PanelLabel } from "./PanelLabel";
import type { BoardMark } from "../../models/BoardMark";
import type { GameDisplay } from "../../models/GameDisplay";
import type { Game } from "@tetris-trainer/game";
import type { Graphics, Ticker } from "pixi.js";

interface GameGraphicsProps {
	readonly game: Game;
	readonly marks: ReadonlyArray<BoardMark>;
	readonly display: GameDisplay;
	readonly onGameOver?: () => void;
}

export function GameGraphics({ game, marks, display, onGameOver }: GameGraphicsProps) {
	const { app } = useApplication();
	const graphicsRef = useRef<Graphics>(null);
	const [screen, setScreen] = useState<Size>(() => ({ width: app.screen.width, height: app.screen.height }));
	const layout = useMemo(() => layoutFor(screen), [screen]);
	const draw = useCallback(
		(graphics: Graphics) => drawGame(graphics, game, layout, marks, display),
		[game, layout, marks, display],
	);

	useEffect(() => {
		const { renderer } = app;
		const handleResize = (width: number, height: number) => setScreen({ width, height });

		renderer.on("resize", handleResize);

		return () => {
			renderer.off("resize", handleResize);
		};
	}, [app]);

	const update = useCallback(
		(ticker: Ticker) => {
			game.advance(ticker.deltaMS);

			if (graphicsRef.current) draw(graphicsRef.current);

			if (game.isOver) onGameOver?.();
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
