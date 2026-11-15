import { Mino } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { boardMetrics } from "./boardMetrics";

const EMPTY_ROW = [null, null, null];

describe("boardMetrics", () => {
	it("measures an empty board", () => {
		expect(boardMetrics([EMPTY_ROW, EMPTY_ROW])).toEqual({ height: 0, holes: 0 });
	});

	it("counts empty cells under a column's top block as holes", () => {
		expect(boardMetrics([[Mino.I, null, null], [Mino.I, null, Mino.I], EMPTY_ROW])).toEqual({ height: 2, holes: 1 });
	});
});
