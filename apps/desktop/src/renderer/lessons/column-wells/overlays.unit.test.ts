import { Mino, simBoardOf, type SimBoard } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { fourCount, wellOverlays } from "./overlays";
import { isOverCeiling } from "./rules";
import { wellStage } from "./stages";
import type { BoardOverlay } from "../../models/BoardOverlay";

const boardOf = (rows: ReadonlyArray<string>): SimBoard =>
	simBoardOf([...rows].reverse().map((row) => [...row].map((cell) => (cell === "#" ? Mino.GARBAGE : null))));

const rowOf = (overlay: BoardOverlay | undefined): number => (overlay?.kind === "rowLine" ? overlay.row : -1);

describe("Column wells row lines", () => {
	it("draws the four-count at the top edge of the four rows from the well floor up", () => {
		const stage = wellStage("nine-zero");

		expect(rowOf(fourCount(simBoardOf([]), stage))).toBe(3);
		expect(rowOf(fourCount(boardOf(["#.........", "##########"]), stage))).toBe(4);
	});

	it("draws the ceiling below the first row that fails Over the ceiling", () => {
		const stage = wellStage("eternal");
		const line = rowOf(
			wellOverlays(stage, simBoardOf([])).find(
				(overlay) => overlay.kind === "rowLine" && overlay.label === "Ceiling",
			),
		);

		expect(isOverCeiling([[0, line + 1]], stage)).toBe(true);
		expect(isOverCeiling([[0, line]], stage)).toBe(false);
	});
});
