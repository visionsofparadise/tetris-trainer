import { describe, expect, it } from "vitest";
import { cellsPoint, leaderTo } from "./noteGeometry";

const BOARD = { left: 0, top: 0, right: 300, bottom: 600 };

describe("cellsPoint", () => {
	it("points at the cell nearest the middle of the piece", () => {
		expect(
			cellsPoint(
				[
					[0, 0],
					[1, 0],
					[0, 1],
					[0, 2],
				],
				BOARD,
			),
		).toEqual({ x: 15, y: 555 });
	});
});

describe("leaderTo", () => {
	const card = { left: 10, top: 100, right: 290, bottom: 200 };

	it("drops straight down to a point below the card", () => {
		expect(leaderTo(card, { x: 150, y: 500 })).toEqual({ start: { x: 150, y: 200 }, end: { x: 150, y: 500 } });
	});

	it("reaches across to the facing edge of a box beside the card", () => {
		expect(leaderTo(card, { left: -120, top: 0, right: -20, bottom: 80 })).toEqual({
			start: { x: 10, y: 100 },
			end: { x: -20, y: 60 },
		});
	});
});
