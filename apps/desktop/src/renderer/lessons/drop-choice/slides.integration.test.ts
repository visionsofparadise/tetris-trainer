import {
	cellsKey,
	DEMO_HANDLING,
	generateMoves,
	placementCells,
	simBoardOf,
	type Block,
	type Move,
	type Placement,
	type SimBoard,
} from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { loadSlide } from "../opener/openerScript";
import { moveRules } from "../target/families";
import { hasSoftDrop } from "../target/goal";
import { DROP_SLIDES } from "./slides";
import type { Slide } from "../opener/Opener";

const boardOf = (slide: Slide): SimBoard => simBoardOf(loadSlide(slide).board);

const markOf = ({ marks }: Slide): Placement => {
	const [mark] = marks;

	if (!mark) throw new Error("The slide marks no spot");

	return mark;
};

const movesTo = (slide: Slide, placement: Placement): Array<Move> =>
	generateMoves(boardOf(slide), placement.mino, moveRules(false), { handling: DEMO_HANDLING, gravity: 0 }).filter(
		({ cells }) => cellsKey(cells) === cellsKey(placementCells(placement)),
	);

describe("drop choice slides", () => {
	const [open, overhang, slide] = DROP_SLIDES;

	if (!open || !overhang || !slide) throw new Error("Drop choice has three slides");

	it("marks a spot a hard drop reaches without a soft drop", () => {
		const [move] = movesTo(open, markOf(open));

		expect(move && hasSoftDrop(move.keys)).toBe(false);
	});

	it("marks a covered spot that a soft drop and a slide reach", () => {
		const [move] = movesTo(slide, markOf(slide));
		const keys = move?.keys ?? [];
		const drop = keys.findIndex((step) => "hold" in step);

		expect(drop).toBeGreaterThanOrEqual(0);
		expect(
			keys.slice(drop + 1).every((step) => "das" in step || ("tap" in step && !step.tap.startsWith("rotate"))),
		).toBe(true);
	});

	it("draws the pink ghost where a hard drop of the same turn lands, on the overhang's cells", () => {
		const [ghost] = overhang.overlays ?? [];
		const covered = markOf(overhang);
		const landings = generateMoves(boardOf(overhang), covered.mino, moveRules(false), {
			handling: DEMO_HANDLING,
			gravity: 0,
		}).filter(
			({ placement, keys }) =>
				placement.orientation === covered.orientation && placement.column === covered.column && !hasSoftDrop(keys),
		);
		const { rows } = boardOf(overhang);
		const [aim] = overhang.notes[0]?.aims ?? [];

		expect(ghost?.kind === "ghost" && cellsKey(ghost.cells)).toBe(cellsKey(landings[0]?.cells ?? []));
		expect(Array.isArray(aim) && aim.every(([x, y]: Block) => ((rows[y] ?? 0) & (1 << x)) !== 0)).toBe(true);
	});
});
