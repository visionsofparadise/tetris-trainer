import { placementCells } from "@tetris-trainer/game";
import type { Slide } from "../lessons/opener/Opener";
import type { BoardMark } from "../models/BoardMark";
import type { BoardNote } from "../models/BoardNote";

export const slideNotes = ({ notes }: Slide): ReadonlyArray<BoardNote> =>
	notes.map(({ text, aims }) => ({
		text,
		tone: "lime",
		targets: aims.map((aim) => ({ at: typeof aim === "string" ? aim : placementCells(aim), tone: "lime" })),
	}));

export const slideMarks = ({ marks }: Slide): ReadonlyArray<BoardMark> =>
	marks.map((placement) => ({ cells: placementCells(placement), tone: "target" }));
