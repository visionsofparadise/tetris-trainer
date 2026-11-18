import {
	cellsKey,
	DEMO_HANDLING,
	generateMoves,
	Mino,
	placementCells,
	simBoardOf,
	type Placement,
} from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { loadSlide } from "../opener/openerScript";
import { moveRules } from "../target/families";
import {
	DOUBLE_BOARD,
	DOUBLE_T,
	MINI_BOARD,
	MINI_T,
	SINGLE_BOARD,
	T_SPIN_SLIDES,
	TRIPLE_BOARD,
	TRIPLE_T,
} from "./slides";

const spinsAt = (rows: ReadonlyArray<string>, placement: Placement): Array<string> => {
	const game = loadSlide({ title: "", notes: [], board: [{ rows }], marks: [] });

	return generateMoves(simBoardOf(game.board), Mino.T, moveRules(true), { handling: DEMO_HANDLING, gravity: 0 })
		.filter(({ cells }) => cellsKey(cells) === cellsKey(placementCells(placement)))
		.map(({ spin, lines }) => `${spin} ${lines}`);
};

describe("T-spin slides", () => {
	it.each([
		["double", DOUBLE_BOARD, DOUBLE_T, "normal 2"],
		["single", SINGLE_BOARD, DOUBLE_T, "normal 1"],
		["mini", MINI_BOARD, MINI_T, "mini 1"],
		["triple", TRIPLE_BOARD, TRIPLE_T, "normal 3"],
	] as const)("marks a T the %s board's spin reaches", (_, rows, placement, spin) => {
		expect(spinsAt(rows, placement)).toContain(spin);
	});

	it("loads every slide", () => {
		for (const slide of T_SPIN_SLIDES) expect(() => loadSlide(slide)).not.toThrow();
	});
});
