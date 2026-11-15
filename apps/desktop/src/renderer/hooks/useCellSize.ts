import { useSyncExternalStore } from "react";
import { windowCellSize } from "../utils/stageLayout";

const subscribe = (onChange: () => void): (() => void) => {
	window.addEventListener("resize", onChange);

	return () => window.removeEventListener("resize", onChange);
};

const snapshot = (): number => windowCellSize({ width: window.innerWidth, height: window.innerHeight });

export const useCellSize = (): number => useSyncExternalStore(subscribe, snapshot);
