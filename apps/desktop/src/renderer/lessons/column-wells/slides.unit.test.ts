import {
	cellsKey,
	DEMO_HANDLING,
	generateMoves,
	lockCells,
	placementCells,
	simBoardOf,
	type Placement,
	type SimBoard,
} from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { WELLS_SLIDES } from "./slides";
import type { Slide } from "../opener/Opener";

const OPEN_RULES = {
	allow180: true,
	excluded: {},
	holeFreeOnly: false,
	ceiling: null,
	quadClearsOnly: false,
	deadRows: 0,
};

const slideNamed = (title: string): Slide => {
	const slide = WELLS_SLIDES.find((candidate) => candidate.title === title);

	if (!slide) throw new Error(`No slide ${title}`);

	return slide;
};

const boardOf = ({ board }: Slide): SimBoard =>
	board
		.filter((item): item is Placement => "mino" in item)
		.reduce((stack, placement) => lockCells(stack, placementCells(placement), "none").board, simBoardOf([]));

const markOf = ({ marks }: Slide, orientation: Placement["orientation"]): Placement => {
	const mark = marks.find((candidate) => candidate.orientation === orientation && candidate.row < 20);

	if (!mark) throw new Error("No mark");

	return mark;
};

describe("Column wells slides", () => {
	it("shows a well I that clears four rows on the first slide and three on the second", () => {
		const right = slideNamed("The right well");
		const beside = slideNamed("Beside the well");

		expect(lockCells(boardOf(right), placementCells(markOf(right, "right")), "none").lines).toBe(4);
		expect(lockCells(boardOf(beside), placementCells(markOf(beside, "right")), "none").lines).toBe(3);
	});

	it("shows a T that spins into its slot and clears two rows", () => {
		const slide = slideNamed("Why 6-3");
		const slot = markOf(slide, "reverse");
		const move = generateMoves(boardOf(slide), slot.mino, OPEN_RULES, { handling: DEMO_HANDLING, gravity: 0 }).find(
			({ cells }) => cellsKey(cells) === cellsKey(placementCells(slot)),
		);

		expect(move).toMatchObject({ spin: "normal", lines: 2 });
	});
});
