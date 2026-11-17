import { Mino, type Block, type Placement } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { mistakeMarks, mistakeNotes } from "./mistakeNotes";
import type { Position } from "../lessons/opener/Opener";
import type { PracticeMistake } from "../lessons/opener/practiceSession";

const I_PLACEMENT: Placement = { mino: Mino.I, orientation: "spawn", column: 3, row: 0 };

const I_CELLS: ReadonlyArray<Block> = [
	[3, 0],
	[4, 0],
	[5, 0],
	[6, 0],
];

const I_POSITION: Position = { placement: I_PLACEMENT, after: [], description: "Lay the I flat." };

const PLACED: Array<Block> = [
	[0, 0],
	[1, 0],
	[2, 0],
	[3, 0],
];

const PLACE_BEST = { kind: "place", position: I_POSITION, reason: "Lay the I flat." } as const;

const HOLD_BEST = { kind: "hold", reason: "Hold the Z." } as const;

describe("mistakeNotes and mistakeMarks", () => {
	it("point at a misplaced piece and its placement", () => {
		const mistake: PracticeMistake = { kind: "placement", detail: "Wrong spot.", placed: PLACED, best: PLACE_BEST };

		expect(mistakeNotes(mistake)).toEqual([
			{
				title: "Placement",
				text: "Wrong spot.",
				tone: "pink",
				targets: [
					{ at: PLACED, tone: "pink" },
					{ at: I_CELLS, tone: "lime" },
				],
			},
		]);
		expect(mistakeMarks(mistake)).toEqual([
			{ cells: PLACED, tone: "mistake" },
			{ cells: I_CELLS, tone: "target" },
		]);
	});

	it("point at a placed piece and the hold box when hold was best", () => {
		const mistake: PracticeMistake = { kind: "order", detail: "Too early.", placed: PLACED, best: HOLD_BEST };

		expect(mistakeNotes(mistake)).toEqual([
			{
				title: "Order",
				text: "Too early.",
				tone: "pink",
				targets: [
					{ at: PLACED, tone: "pink" },
					{ at: "hold", tone: "lime" },
				],
			},
		]);
		expect(mistakeMarks(mistake)).toEqual([{ cells: PLACED, tone: "mistake" }]);
	});

	it("point at the hold box and the placement when a hold was wrong", () => {
		const mistake: PracticeMistake = { kind: "hold", detail: "Place it.", placed: "hold", best: PLACE_BEST };

		expect(mistakeNotes(mistake)).toEqual([
			{
				title: "Hold",
				text: "Place it.",
				tone: "pink",
				targets: [
					{ at: "hold", tone: "pink" },
					{ at: I_CELLS, tone: "lime" },
				],
			},
		]);
		expect(mistakeMarks(mistake)).toEqual([{ cells: I_CELLS, tone: "target" }]);
	});

	it("leave a top-out without targets or marks", () => {
		const mistake: PracticeMistake = { kind: "top-out", placed: null, best: null };

		expect(mistakeNotes(mistake)).toEqual([{ title: "Top out", text: undefined, tone: "pink", targets: [] }]);
		expect(mistakeMarks(mistake)).toEqual([]);
	});

	it("point only at the placed piece when no move is best", () => {
		const mistake: PracticeMistake = { kind: "impossible", detail: "Two wait.", placed: PLACED, best: null };

		expect(mistakeNotes(mistake)).toEqual([
			{ title: "Impossible", text: "Two wait.", tone: "pink", targets: [{ at: PLACED, tone: "pink" }] },
		]);
		expect(mistakeMarks(mistake)).toEqual([{ cells: PLACED, tone: "mistake" }]);
	});
});
