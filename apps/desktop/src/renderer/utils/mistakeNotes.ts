import { placementCells } from "@tetris-trainer/game";
import { drillMarks, mistakeCard } from "./drillNotes";
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

const bestAt = (best: PracticeMistake["best"]): NoteTarget["at"] | null => {
	if (best === null) return null;

	return best.kind === "hold" ? "hold" : placementCells(best.position.placement);
};

export const mistakeNotes = ({ kind, detail, placed, best }: PracticeMistake): ReadonlyArray<BoardNote> =>
	mistakeCard(MISTAKE_TITLES[kind], detail, placed, bestAt(best));

export const mistakeMarks = ({ placed, best }: PracticeMistake): ReadonlyArray<BoardMark> =>
	drillMarks({
		placed: placed === "hold" ? null : placed,
		best: best?.kind === "place" ? best.position.placement : null,
	});
