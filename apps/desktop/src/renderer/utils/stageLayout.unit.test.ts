import { describe, expect, it } from "vitest";
import { cellSizeFor, windowCellSize } from "./stageLayout";

describe("cellSizeFor", () => {
	it("fits the board to the height of a wide stage", () => {
		expect(cellSizeFor({ width: 1376, height: 758 })).toBe(30);
	});

	it("fits the board to the width of a narrow stage", () => {
		expect(cellSizeFor({ width: 1036, height: 1200 })).toBe(28);
	});

	it("keeps growing on a large screen", () => {
		expect(cellSizeFor({ width: 3008, height: 1560 })).toBe(66);
	});

	it("keeps cells readable on a tiny stage", () => {
		expect(cellSizeFor({ width: 400, height: 300 })).toBe(14);
	});
});

describe("windowCellSize", () => {
	it("leaves room for the title bar and stage padding", () => {
		expect(windowCellSize({ width: 1440, height: 900 })).toBe(29);
	});
});
