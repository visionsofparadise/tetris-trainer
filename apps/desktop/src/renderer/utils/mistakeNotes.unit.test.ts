import { Mino, placementCells, type Block, type Placement } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { mistakeMarks, mistakeNotes } from "./mistakeNotes";
import type { PracticeMistake } from "../lessons/opener/practiceSession";

const BEST_PLACEMENT: Placement = { mino: Mino.O, orientation: "spawn", column: 4, row: 6 };

const BEST_CELLS = placementCells(BEST_PLACEMENT);

const PLACED: Array<Block> = [
	[0, 9],
	[1, 9],
	[2, 9],
	[3, 9],
];

const PLACE_BEST = { kind: "place", placement: BEST_PLACEMENT } as const;

const HOLD_BEST = { kind: "hold" } as const;

const KIND = "placement";

const TITLE = "Placement";

describe("mistakeNotes and mistakeMarks", () => {
	it("point at the placed cells and a best placement", () => {
		const mistake: PracticeMistake = { kind: KIND, placed: PLACED, best: PLACE_BEST };

		expect(mistakeNotes(mistake)).toEqual([
			{
				title: TITLE,
				tone: "pink",
				targets: [
					{ at: PLACED, tone: "pink" },
					{ at: BEST_CELLS, tone: "lime" },
				],
			},
		]);
		expect(mistakeMarks(mistake)).toEqual([
			{ cells: PLACED, tone: "mistake" },
			{ cells: BEST_CELLS, tone: "target" },
		]);
	});

	it("point at the hold box when a hold is best", () => {
		const mistake: PracticeMistake = { kind: KIND, placed: PLACED, best: HOLD_BEST };

		expect(mistakeNotes(mistake)).toEqual([
			{
				title: TITLE,
				tone: "pink",
				targets: [
					{ at: PLACED, tone: "pink" },
					{ at: "hold", tone: "lime" },
				],
			},
		]);
		expect(mistakeMarks(mistake)).toEqual([{ cells: PLACED, tone: "mistake" }]);
	});

	it("point at the hold box when a hold was the move", () => {
		const mistake: PracticeMistake = { kind: KIND, placed: "hold", best: PLACE_BEST };

		expect(mistakeNotes(mistake)).toEqual([
			{
				title: TITLE,
				tone: "pink",
				targets: [
					{ at: "hold", tone: "pink" },
					{ at: BEST_CELLS, tone: "lime" },
				],
			},
		]);
		expect(mistakeMarks(mistake)).toEqual([{ cells: BEST_CELLS, tone: "target" }]);
	});

	it("point only at the placed cells when no move is best", () => {
		const mistake: PracticeMistake = { kind: KIND, placed: PLACED, best: null };

		expect(mistakeNotes(mistake)).toEqual([{ title: TITLE, tone: "pink", targets: [{ at: PLACED, tone: "pink" }] }]);
		expect(mistakeMarks(mistake)).toEqual([{ cells: PLACED, tone: "mistake" }]);
	});

	it("leave a mistake with no move and no best without targets or marks", () => {
		const mistake: PracticeMistake = { kind: "top-out", placed: null, best: null };

		expect(mistakeNotes(mistake)).toEqual([{ title: "Top out", tone: "pink", targets: [] }]);
		expect(mistakeMarks(mistake)).toEqual([]);
	});
});
