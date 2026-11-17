import { DEFAULT_CONFIG, Mino, type Block, type Placement } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { drillMarks, drillNotes } from "./drillNotes";
import type { DrillMistake } from "../lessons/drill/Drill";

const T_TARGET: Placement = { mino: Mino.T, orientation: "spawn", column: 0, row: 0 };

const T_CELLS: ReadonlyArray<Block> = [
	[1, 1],
	[0, 0],
	[1, 0],
	[2, 0],
];

describe("drillNotes and drillMarks", () => {
	it("point only at the target when the piece sits on it", () => {
		const mistake: DrillMistake = { kind: "extra-press", title: "Extra press", placed: T_CELLS, best: T_TARGET };

		expect(drillNotes(mistake, DEFAULT_CONFIG)[0]?.targets).toEqual([{ at: expect.any(Array), tone: "lime" }]);
		expect(drillMarks(mistake)).toEqual([{ cells: expect.any(Array), tone: "target" }]);
	});
});
