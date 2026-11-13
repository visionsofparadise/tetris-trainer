import { DEFAULT_CONFIG, parseTetrioConfig, type TetrioConfig } from "@tetris-trainer/game";
import { createMutableState, subscribe } from "opshot";

export interface Settings {
	config: TetrioConfig;
	configName: string | null;
}

const CONFIG_KEY = "config";
const CONFIG_NAME_KEY = "configName";

const loadConfig = (storage: Storage): TetrioConfig => {
	const saved = storage.getItem(CONFIG_KEY);

	if (saved === null) return DEFAULT_CONFIG;

	try {
		return parseTetrioConfig(saved);
	} catch {
		return DEFAULT_CONFIG;
	}
};

export const createSettings = (storage: Storage): Settings => {
	const settings = createMutableState<Settings>({
		config: loadConfig(storage),
		configName: storage.getItem(CONFIG_NAME_KEY),
	});

	subscribe(settings, () => {
		storage.setItem(CONFIG_KEY, JSON.stringify(settings.config));

		if (settings.configName === null) storage.removeItem(CONFIG_NAME_KEY);
		else storage.setItem(CONFIG_NAME_KEY, settings.configName);
	});

	return settings;
};
