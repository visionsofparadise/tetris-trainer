import { keyLabel } from "./keyLabel";
import type { TetrioConfig } from "@tetris-trainer/game";

const NO_CODES: ReadonlyArray<string> = [];

export const retryHints = (
	config: TetrioConfig,
	action: string,
	otherCodes: ReadonlyArray<string> = NO_CODES,
): ReadonlyArray<string> => {
	const codes = [...otherCodes, ...config.controls.custom.retry.slice(0, 1)];

	return codes.length === 0 ? [] : [`${codes.map(keyLabel).join(" or ")} to ${action}`];
};
