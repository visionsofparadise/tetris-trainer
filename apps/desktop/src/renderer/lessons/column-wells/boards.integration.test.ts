import { DEFAULT_CONFIG, Mino, searchQuadReady, type SearchResult } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { searchStateOf } from "../../search/searchStateOf";
import { cleanOpening, CONVERT_SEEDS, convertOpening, convertStack, openingGame, type WellsOpening } from "./boards";
import { stackHeight } from "./boardFacts";
import { goalOf, wellsRules, WELLS_GRAVITY } from "./rules";
import { wellStage } from "./stages";

const KEEP_BUDGET = { nodes: 50000, depth: 6, deadlineMs: null };

const convertSearch = (opening: WellsOpening): SearchResult => {
	const stage = wellStage("convert");

	return searchQuadReady(
		searchStateOf(openingGame(opening)),
		goalOf(stage),
		wellsRules(stage, true),
		{ handling: DEFAULT_CONFIG.handling, gravity: WELLS_GRAVITY },
		KEEP_BUDGET,
	);
};

const SKEWED: ReadonlyArray<Mino> = [Mino.S, Mino.Z];

const opener = (seed: number): ReadonlyArray<Mino> => {
	const game = openingGame({ board: [], queue: [], seed });

	return [game.falling.mino, ...game.next.slice(0, 1)];
};

describe("Convert boards", () => {
	it("pins the first kept board: a 9-0 stack dug by five rows, four locks from quad-ready", () => {
		const opening = convertOpening(0);

		expect(opening.seed).toBe(CONVERT_SEEDS[0]);
		expect(opening.board.at(-1)).toEqual({ dig: 5 });
		expect(convertSearch(opening)).toMatchObject({ kind: "reached", locks: 4 });
	});

	it.each(CONVERT_SEEDS)("keeps stack %i low and within reach of quad-ready", (seed) => {
		const opening: WellsOpening = { board: convertStack(seed), queue: [], seed };
		const height = stackHeight(searchStateOf(openingGame(opening)).board);

		expect(height).toBeGreaterThanOrEqual(4);
		expect(height).toBeLessThanOrEqual(6);
		expect(convertSearch(opening).kind).toBe("reached");
	});
});

describe("clean openings", () => {
	it("deals past a bag that opens with S and Z", () => {
		const seed = Array.from({ length: 500 }, (_, index) => index + 1).find((candidate) =>
			opener(candidate).every((mino) => SKEWED.includes(mino)),
		);

		if (seed === undefined) throw new Error("No skewed opening in the first 500 seeds");

		const opening = cleanOpening([], seed);

		expect(opening.seed).not.toBe(seed);
		expect(opener(opening.seed).every((mino) => SKEWED.includes(mino))).toBe(false);
	});
});
