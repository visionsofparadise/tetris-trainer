import { describe, expect, it } from "vitest";
import { blockFace, shapeEdges } from "./blockStyle";

const BOX = { left: 0, top: 0, size: 10, line: 1 };

describe("blockFace", () => {
	it("shades the inside corner where a piece turns", () => {
		const cells = new Set(["0,0", "0,1", "1,1"]);
		const isMember = (column: number, row: number) => cells.has(`${column},${row}`);

		expect(blockFace(BOX, shapeEdges(0, 1, isMember)).notches).toEqual([{ x: 9, y: 0, width: 1, height: 1 }]);
		expect(blockFace(BOX, shapeEdges(0, 0, isMember)).notches).toEqual([]);
	});

	it("leaves a straight run without corner shading", () => {
		const isMember = (column: number, row: number) => row === 0 && column >= 0 && column < 4;

		expect(blockFace(BOX, shapeEdges(1, 0, isMember))).toEqual({
			inner: { x: 0, y: 1, width: 10, height: 8 },
			notches: [],
		});
	});
});
