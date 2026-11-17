import { useApplication, useTick } from "@pixi/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INK, TONE_COLORS } from "../../utils/blockStyle";
import { drawGame } from "../../utils/drawGame";
import { layoutFor, type Size } from "../../utils/gameLayout";
import { overlayLabels } from "../../utils/overlayLabels";
import type { BoardMark } from "../../models/BoardMark";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { GameDisplay } from "../../models/GameDisplay";
import type { Game } from "@tetris-trainer/game";
import type { Graphics, Ticker } from "pixi.js";

interface GameGraphicsProps {
	readonly game: Game;
	readonly marks: ReadonlyArray<BoardMark>;
	readonly overlays: ReadonlyArray<BoardOverlay>;
	readonly display: GameDisplay;
	readonly isPaused: boolean;
	readonly onGameOver?: () => void;
}

const LABEL_FONT = "JetBrains Mono Variable";

export function GameGraphics({ game, marks, overlays, display, isPaused, onGameOver }: GameGraphicsProps) {
	const { app } = useApplication();
	const graphicsRef = useRef<Graphics>(null);
	const [screen, setScreen] = useState<Size>(() => ({ width: app.screen.width, height: app.screen.height }));
	const layout = useMemo(() => layoutFor(screen), [screen]);
	const draw = useCallback(
		(graphics: Graphics) => drawGame(graphics, game, layout, marks, overlays, display),
		[game, layout, marks, overlays, display],
	);
	const labels = useMemo(
		() =>
			overlayLabels(overlays, layout).map(({ text, tone, x, y, anchor, fontSize, badge }) => ({
				key: `${x},${y},${text}`,
				text,
				x,
				y,
				anchor,
				style: {
					fontFamily: LABEL_FONT,
					fontSize,
					fontWeight: "700" as const,
					fill: badge ? INK : TONE_COLORS[tone],
				},
			})),
		[overlays, layout],
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
			if (!isPaused) game.advance(ticker.deltaMS);

			if (graphicsRef.current) draw(graphicsRef.current);

			if (game.isOver) onGameOver?.();
		},
		[game, draw, isPaused, onGameOver],
	);

	useTick(update);

	return (
		<>
			<pixiGraphics ref={graphicsRef} draw={draw} />
			{labels.map(({ key, ...label }) => (
				<pixiText key={key} {...label} />
			))}
		</>
	);
}
