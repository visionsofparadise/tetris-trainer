import { keyLabel } from "./keyLabel";
import type { TetrioConfig } from "@tetris-trainer/game";

export const retryHints = (config: TetrioConfig, action: string): ReadonlyArray<string> =>
	config.controls.custom.retry.slice(0, 1).map((code) => `${keyLabel(code)} to ${action}`);
