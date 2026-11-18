import {
	cellsKey,
	DEMO_HANDLING,
	generateMoves,
	placementCells,
	simBoardOf,
	type Placement,
} from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { loadSlide } from "../opener/openerScript";
import { moveRules } from "../target/families";
import { J_BOARD, J_SPIN, SPIN_SLIDES, Z_BOARD, Z_SPIN } from "./slides";

const spinsAt = (rows: ReadonlyArray<string>, placement: Placement): Array<string> => {
	const game = loadSlide({ title: "", notes: [], board: [{ rows }], marks: [] });

	return generateMoves(simBoardOf(game.board), placement.mino, moveRules(false), {
		handling: DEMO_HANDLING,
		gravity: 0,
	})
		.filter(({ cells }) => cellsKey(cells) === cellsKey(placementCells(placement)))
		.map(({ spin, lines }) => `${spin} ${lines}`);
};

describe("spin slides", () => {
	it.each([
		["Z", Z_BOARD, Z_SPIN],
		["J", J_BOARD, J_SPIN],
	] as const)("marks a %s spot that only a spin reaches, a mini double", (_, rows, placement) => {
		expect(spinsAt(rows, placement)).toEqual(["mini 2"]);
	});

	it("loads every slide", () => {
		for (const slide of SPIN_SLIDES) expect(() => loadSlide(slide)).not.toThrow();
	});
});
