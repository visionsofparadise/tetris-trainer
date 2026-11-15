import { placementCells } from "@tetris-trainer/game";
import type { PracticeMistake, PracticeMistakeKind } from "../lessons/opener/practiceSession";
import type { BoardMark } from "../models/BoardMark";
import type { BoardNote, NoteTarget } from "../models/BoardNote";

const MISTAKE_TITLES: Record<PracticeMistakeKind, string> = {
	placement: "Placement",
	order: "Order",
	"dead-end": "Dead end",
	hold: "Hold",
	"next-bag": "Next bag",
	impossible: "Impossible",
	possible: "Possible",
	"top-out": "Top out",
};

const placedTarget = ({ placed }: PracticeMistake): Array<NoteTarget> =>
	placed === null ? [] : [{ at: placed, tone: "pink" }];

const bestTarget = ({ best }: PracticeMistake): Array<NoteTarget> => {
	if (best === null) return [];

	return [{ at: best.kind === "hold" ? "hold" : placementCells(best.position.placement), tone: "lime" }];
};

export const mistakeNotes = (mistake: PracticeMistake): ReadonlyArray<BoardNote> => [
	{
		title: MISTAKE_TITLES[mistake.kind],
		text: mistake.detail,
		tone: "pink",
		targets: [...placedTarget(mistake), ...bestTarget(mistake)],
	},
];

export const mistakeMarks = ({ placed, best }: PracticeMistake): ReadonlyArray<BoardMark> => [
	...(Array.isArray(placed) ? [{ cells: placed, tone: "mistake" as const }] : []),
	...(best?.kind === "place" ? [{ cells: placementCells(best.position.placement), tone: "target" as const }] : []),
];
