import type { PlaceEvent } from "@tetris-trainer/game";

const LINE_NAMES = ["", "single", "double", "triple", "quad"];

const capitalized = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

export const isScored = ({ lines, spin }: Pick<PlaceEvent, "lines" | "spin">): boolean => lines > 0 || spin !== "none";

export const clearName = ({
	placement,
	lines,
	spin,
	isPerfectClear,
}: Pick<PlaceEvent, "placement" | "lines" | "spin" | "isPerfectClear">): string => {
	const spinName = spin === "none" ? "" : `${placement.mino.toUpperCase()}-spin${spin === "mini" ? " mini" : ""}`;
	const name = capitalized([spinName, LINE_NAMES[lines] ?? `${lines} lines`].filter(Boolean).join(" "));

	return isPerfectClear ? `${name} · Perfect clear` : name;
};

export const isDifficult = ({ lines, spin }: Pick<PlaceEvent, "lines" | "spin">): boolean =>
	lines >= 4 || (lines > 0 && spin !== "none");
