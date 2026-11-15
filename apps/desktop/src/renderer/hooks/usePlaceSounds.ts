import { useEffect } from "react";
import { isDifficult } from "../utils/clearName";
import type { Sound } from "../models/Sound";
import type { Game } from "@tetris-trainer/game";

export const usePlaceSounds = (game: Game, sound: Sound) => {
	useEffect(
		() =>
			game.on("place", (event) => {
				if (event.lines === 0) sound.play("place");
				else sound.playClear({ streak: Math.max(event.combo, event.b2b), isDifficult: isDifficult(event) });
			}),
		[game, sound],
	);
};
