import { describe, expect, it } from "vitest";
import { placementCells } from "../pieces";
import { emptySimBoard, lockCells, type SimBoard } from "../sim/simBoard";
import { cleanStack } from "./cleanStack";

const stacked = (seed: number, well: number | null): { readonly board: SimBoard; readonly placed: number } => {
	const placements = cleanStack(seed, 30, 12, well);
	const board = placements.reduce(
		(current, placement) => lockCells(current, placementCells(placement), "none").board,
		emptySimBoard(),
	);

	return { board, placed: placements.length };
};

const isCovered = (board: SimBoard, x: number, y: number): boolean =>
	((board.rows[y] ?? 0) & (1 << x)) === 0 && board.rows.slice(y + 1).some((row) => (row & (1 << x)) !== 0);

const coveredCells = (board: SimBoard): number =>
	Array.from({ length: 12 }, (_, y) => Array.from({ length: 10 }, (_, x) => isCovered(board, x, y)))
		.flat()
		.filter(Boolean).length;

describe("cleanStack", () => {
	it("stacks with no covered cells, an empty well and no cell at or above the cap", () => {
		const { board, placed } = stacked(7, 9);

		expect(coveredCells(board)).toBe(0);
		expect(board.rows.every((row) => (row & (1 << 9)) === 0)).toBe(true);
		expect(board.rows.slice(12).every((row) => row === 0)).toBe(true);
		expect(placed).toBeGreaterThanOrEqual(15);
	});

	it("deals the same stack for the same seed and a different one for another", () => {
		expect(cleanStack(3, 30, 12, null)).toEqual(cleanStack(3, 30, 12, null));
		expect(cleanStack(3, 30, 12, null)).not.toEqual(cleanStack(4, 30, 12, null));
	});
});
