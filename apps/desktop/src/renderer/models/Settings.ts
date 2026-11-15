import { createMutableState, subscribe } from "opshot";
import { parseSettings, serializeSettings } from "../utils/settingsFile";
import type { TetrioConfig } from "@tetris-trainer/game";

export interface Settings {
	config: TetrioConfig;
	configName: string | null;
	volume: number;
}

export const createSettings = (saved: string | null, save: (text: string) => unknown): Settings => {
	const settings = createMutableState<Settings>(parseSettings(saved));

	subscribe(settings, () => save(serializeSettings(settings)));

	return settings;
};
