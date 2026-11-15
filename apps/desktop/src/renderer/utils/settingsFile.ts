import { DEFAULT_CONFIG, readTetrioConfig, type TetrioConfig } from "@tetris-trainer/game";
import { clampVolume, DEFAULT_VOLUME } from "./volume";
import type { Settings } from "../models/Settings";

const DEFAULT_SETTINGS: Settings = { config: DEFAULT_CONFIG, configName: null, volume: DEFAULT_VOLUME };

const readConfig = (value: unknown): TetrioConfig => {
	try {
		return readTetrioConfig(value);
	} catch {
		return DEFAULT_CONFIG;
	}
};

const readJson = (text: string): unknown => {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
};

export const parseSettings = (text: string | null): Settings => {
	const saved = text === null ? null : readJson(text);

	if (typeof saved !== "object" || saved === null) return DEFAULT_SETTINGS;

	const { config, configName, volume } = saved as Partial<Record<keyof Settings, unknown>>;

	return {
		config: readConfig(config),
		configName: typeof configName === "string" ? configName : null,
		volume: typeof volume === "number" ? clampVolume(volume) : DEFAULT_VOLUME,
	};
};

export const serializeSettings = ({ config, configName, volume }: Settings): string =>
	JSON.stringify({ config, configName, volume }, null, "\t");
