import { placementCells } from "@tetris-trainer/game";
import type { DrillMistake } from "../lessons/drill/Drill";
import type { BoardMark } from "../models/BoardMark";
import type { BoardNote, NoteTarget } from "../models/BoardNote";

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
