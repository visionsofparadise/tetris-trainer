import { useEffect } from "react";
import type { Sound } from "../models/Sound";
import type { Game } from "@tetris-trainer/game";

export const usePlaceSounds = (game: Game, sound: Sound) => {
	useEffect(() => game.on("place", ({ lines }) => sound.play(lines > 0 ? "clear" : "place")), [game, sound]);
};
