import { useEffect, useState } from "react";
import { boardMetrics } from "../utils/boardMetrics";
import type { Game, Mino } from "@tetris-trainer/game";

const FRAMES_PER_SECOND = 60;

export interface GameReadout {
	readonly isHoldEnabled: boolean;
	readonly hold: Mino | null;
	readonly next: ReadonlyArray<Mino>;
	readonly pieces: number;
	readonly lines: number;
	readonly attack: number;
	readonly frames: number;
	readonly height: number;
	readonly holes: number;
}

const readGame = (game: Game): GameReadout => ({
	isHoldEnabled: game.isHoldEnabled,
	hold: game.hold,
	next: game.next,
	...game.stats,
	...boardMetrics(game.board),
});

const keyOf = ({ isHoldEnabled, hold, next, pieces, lines, attack, frames, height, holes }: GameReadout): string =>
	[
		isHoldEnabled,
		hold,
		next.join(""),
		pieces,
		lines,
		attack,
		Math.floor(frames / FRAMES_PER_SECOND),
		height,
		holes,
	].join("|");

export const useGameReadout = (game: Game): GameReadout => {
	const [readout, setReadout] = useState(() => readGame(game));

	useEffect(() => {
		let lastKey = "";
		let frameId = 0;

		const poll = () => {
			const next = readGame(game);
			const key = keyOf(next);

			if (key !== lastKey) {
				lastKey = key;
				setReadout(next);
			}

			frameId = requestAnimationFrame(poll);
		};

		frameId = requestAnimationFrame(poll);

		return () => cancelAnimationFrame(frameId);
	}, [game]);

	return readout;
};
