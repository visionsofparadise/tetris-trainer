import { findAction } from "@tetris-trainer/game";
import { useEffect } from "react";
import type { AppContext } from "../models/AppContext";

const CONTINUE_CODE = "Space";

export const useContinueKey = (isActive: boolean, onContinue: () => void, context: AppContext): void => {
	const { settings } = context;

	useEffect(() => {
		if (!isActive) return;

		const { config } = settings;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.repeat) return;

			if (event.code !== CONTINUE_CODE && findAction(config, event.code) !== "hardDrop") return;

			event.preventDefault();
			onContinue();
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isActive, onContinue, settings]);
};
