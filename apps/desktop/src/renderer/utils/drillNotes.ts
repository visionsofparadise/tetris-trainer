import { cellsKey, placementCells, type Block, type TetrioConfig } from "@tetris-trainer/game";
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

const misplaced = (
	placed: ReadonlyArray<Block> | null,
	target: ReadonlyArray<Block> | null,
): ReadonlyArray<Block> | null =>
	placed !== null && target !== null && cellsKey(placed) === cellsKey(target) ? null : placed;

export const drillMarks = ({ placed, best }: MarkedMistake): ReadonlyArray<BoardMark> => {
	const target = best === null ? null : placementCells(best);
	const wrong = misplaced(placed, target);

	return [
		...(wrong === null ? [] : [{ cells: wrong, tone: "mistake" as const }]),
		...(target === null ? [] : [{ cells: target, tone: "target" as const }]),
	];
};

const keyRows = ({ yours, minimal }: KeyComparison, config: TetrioConfig): ReadonlyArray<KeyRow> => [
	{ label: "Yours", tone: "pink", keys: yours.map((step) => stepLabel(step, config)) },
	{ label: "Minimal", tone: "lime", keys: minimal.map((step) => stepLabel(step, config)) },
];

export const drillNotes = (
	{ title, detail, keys, placed, best }: DrillMistake,
	config: TetrioConfig,
): ReadonlyArray<BoardNote> => {
	const target = best === null ? null : placementCells(best);

	return mistakeCard(title, detail, misplaced(placed, target), target).map((note) =>
		keys ? { ...note, keys: keyRows(keys, config) } : note,
	);
};
