import { useEffect, useState } from "react";
import { clearName, isScored } from "../utils/clearName";
import type { Game } from "@tetris-trainer/game";

export interface ClearReadout {
	readonly name: string | null;
	readonly attack: number;
	readonly combo: number;
	readonly b2b: number;
}

const NO_CLEAR: ClearReadout = { name: null, attack: 0, combo: -1, b2b: -1 };

interface GameClear {
	readonly game: Game;
	readonly clear: ClearReadout;
}

export const useLastClear = (game: Game): ClearReadout => {
	const [current, setCurrent] = useState<GameClear>(() => ({ game, clear: NO_CLEAR }));

	useEffect(
		() =>
			game.on("place", (event) =>
				setCurrent(({ game: shown, clear }) => {
					const last = shown === game ? clear : NO_CLEAR;
					const { combo, b2b } = event;

					return {
						game,
						clear: isScored(event)
							? { name: clearName(event), attack: event.attack, combo, b2b }
							: { ...last, combo, b2b },
					};
				}),
			),
		[game],
	);

	return current.game === game ? current.clear : NO_CLEAR;
};
