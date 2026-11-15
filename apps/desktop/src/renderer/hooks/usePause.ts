import { findAction } from "@tetris-trainer/game";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppContext } from "../models/AppContext";
import type { PauseControl } from "../models/PauseControl";

export const usePause = (context: AppContext): PauseControl => {
	const { settings } = context;
	const [isPaused, setIsPaused] = useState(false);
	const toggle = useCallback(() => setIsPaused((paused) => !paused), []);
	const resume = useCallback(() => setIsPaused(false), []);

	useEffect(() => {
		const { config } = settings;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.repeat || findAction(config, event.code) !== "exit") return;

			event.preventDefault();
			toggle();
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [settings, toggle]);

	return useMemo(() => ({ isPaused, toggle, resume }), [isPaused, toggle, resume]);
};
