const NAMED_KEYS: Record<string, string> = {
	ARROWLEFT: "←",
	ARROWRIGHT: "→",
	ARROWUP: "↑",
	ARROWDOWN: "↓",
	SPACE: "SPC",
	SHIFTLEFT: "SHIFT",
	SHIFTRIGHT: "SHIFT",
	CONTROLLEFT: "CTRL",
	CONTROLRIGHT: "CTRL",
	ALTLEFT: "ALT",
	ALTRIGHT: "ALT",
	ESCAPE: "ESC",
	ENTER: "ENTER",
	BACKSPACE: "BKSP",
};

const PREFIXES = ["KEY", "DIGIT", "NUMPAD"];

export const keyLabel = (code: string | undefined): string => {
	if (code === undefined) return "—";

	const key = code.toUpperCase();
	const named = NAMED_KEYS[key];

	if (named !== undefined) return named;

	const prefix = PREFIXES.find((candidate) => key.startsWith(candidate) && key.length > candidate.length);

	return prefix === undefined ? key : key.slice(prefix.length);
};
