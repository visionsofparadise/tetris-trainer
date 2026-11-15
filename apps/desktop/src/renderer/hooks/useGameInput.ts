import { useEffect, useState } from "react";
import type { Game, GameKey } from "@tetris-trainer/game";

const NO_KEYS: ReadonlySet<GameKey> = new Set();

interface PressedKeys {
	readonly game: Game;
	readonly keys: ReadonlySet<GameKey>;
}

export const useGameInput = (game: Game): ReadonlySet<GameKey> => {
	const [pressed, setPressed] = useState<PressedKeys>(() => ({ game, keys: NO_KEYS }));

	useEffect(
		() =>
			game.on("input", ({ type, key }) =>
				setPressed((current) => {
					const keys = new Set(current.game === game ? current.keys : NO_KEYS);

					if (type === "keydown") keys.add(key);
					else keys.delete(key);

					return { game, keys };
				}),
			),
		[game],
	);

	return pressed.game === game ? pressed.keys : NO_KEYS;
};
