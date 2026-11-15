import { findAction, type Game } from "@tetris-trainer/game";
import { useEffect } from "react";
import type { AppContext } from "../models/AppContext";

export const useGameKeyboard = (game: Game, onRetry: () => void, context: AppContext, isPaused = false): void => {
	const { settings } = context;

	useEffect(() => {
		const { config } = settings;

		const handleKeyDown = (event: KeyboardEvent) => {
			const action = findAction(config, event.code);

			if (action === undefined) return;

			event.preventDefault();

			if (event.repeat) return;

			if (action === "retry") onRetry();
			else if (action !== "exit" && !isPaused) game.press(action);
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			const action = findAction(config, event.code);

			if (action === undefined) return;

			event.preventDefault();

			if (action !== "retry" && action !== "exit") game.release(action);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [game, onRetry, settings, isPaused]);
};
