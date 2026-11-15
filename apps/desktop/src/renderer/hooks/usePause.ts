import { findAction } from "@tetris-trainer/game";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppContext } from "../models/AppContext";
import type { PauseControl } from "../models/PauseControl";

const PAUSE_CODE = "Escape";

export const PAUSE_HINT = "Esc to pause";

export const usePause = (context: AppContext, isEnabled = true): PauseControl => {
	const { settings } = context;
	const [isPaused, setIsPaused] = useState(false);
	const toggle = useCallback(() => setIsPaused((paused) => !paused), []);
	const resume = useCallback(() => setIsPaused(false), []);

	useEffect(() => {
		if (!isEnabled) return;

		const { config } = settings;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.repeat || (event.code !== PAUSE_CODE && findAction(config, event.code) !== "exit")) return;

			event.preventDefault();
			toggle();
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [settings, toggle, isEnabled]);

	return useMemo(() => ({ isPaused, toggle, resume }), [isPaused, toggle, resume]);
};
