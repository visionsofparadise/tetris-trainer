import { placementCells, type Block, type TetrioConfig } from "@tetris-trainer/game";
import { stepLabel } from "./keyLabel";
import type { DrillMistake, KeyComparison } from "../lessons/drill/Drill";
import type { BoardMark } from "../models/BoardMark";
import type { BoardNote, KeyRow, NoteTarget } from "../models/BoardNote";

type NoteAt = NoteTarget["at"];

type MarkedMistake = Pick<DrillMistake, "placed" | "best">;

export const mistakeCard = (
	title: string,
	detail: string | undefined,
	placed: NoteAt | null,
	best: NoteAt | null,
): ReadonlyArray<BoardNote> => [
	{
		title,
		text: detail,
		tone: "pink",
		targets: [
			...(placed === null ? [] : [{ at: placed, tone: "pink" as const }]),
			...(best === null ? [] : [{ at: best, tone: "lime" as const }]),
		],
	},
];

export const drillMarks = ({ placed, best }: MarkedMistake): ReadonlyArray<BoardMark> => [
	...(placed === null ? [] : [{ cells: placed, tone: "mistake" as const }]),
	...(best === null ? [] : [{ cells: placementCells(best), tone: "target" as const }]),
];

const cellsKey = (cells: ReadonlyArray<Block>): string =>
	cells
		.map(([x, y]) => `${x},${y}`)
		.sort()
		.join(" ");

const keyRows = ({ yours, minimal }: KeyComparison, config: TetrioConfig): ReadonlyArray<KeyRow> => [
	{ label: "Yours", tone: "pink", keys: yours.map((step) => stepLabel(step, config)) },
	{ label: "Minimal", tone: "lime", keys: minimal.map((step) => stepLabel(step, config)) },
];

export const drillNotes = (
	{ title, keys, placed, best }: DrillMistake,
	config: TetrioConfig,
): ReadonlyArray<BoardNote> => {
	const target = best === null ? null : placementCells(best);
	const pointed = placed !== null && target !== null && cellsKey(placed) === cellsKey(target) ? null : placed;

	return mistakeCard(title, undefined, pointed, target).map((note) =>
		keys ? { ...note, keys: keyRows(keys, config) } : note,
	);
};
