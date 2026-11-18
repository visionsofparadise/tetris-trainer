import { placementCells } from "@tetris-trainer/game";
import type { Decision } from "../lessons/opener/Opener";
import type { BoardMark } from "../models/BoardMark";

export const NO_MARKS: ReadonlyArray<BoardMark> = [];

export const decisionMarks = (decision: Decision | undefined): ReadonlyArray<BoardMark> =>
	decision?.kind === "place" ? [{ cells: placementCells(decision.placement), tone: "target" }] : NO_MARKS;
