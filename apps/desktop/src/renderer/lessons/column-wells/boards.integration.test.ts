import { DEFAULT_CONFIG, LIVE_BUDGET, Mino, rowsReady, searchQuadReady, type SimBoard } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { searchStateOf } from "../../search/searchStateOf";
import {
	cleanOpening,
	CONVERT_SEEDS,
	convertOpening,
	convertStack,
	openingFor,
	openingGame,
	type WellsOpening,
} from "./boards";
import { coveredCells, stackHeight } from "./boardFacts";
import { chooseMove, choiceKeys } from "./policy";
import { goalOf, wellsRules, WELLS_GRAVITY } from "./rules";
import { wellStage } from "./stages";

const SKEWED: ReadonlyArray<Mino> = [Mino.S, Mino.Z];

const WITNESS_LOCKS = 30;

const FRAME_LIMIT = 900;

const opener = (seed: number): ReadonlyArray<Mino> => {
	const game = openingGame({ board: [], queue: [], seed });

	return [game.falling.mino, ...game.next.slice(0, 1)];
};

const heightOf = ({ rows }: SimBoard, x: number): number => {
	for (let y = rows.length - 1; y >= 0; y--) if (((rows[y] ?? 0) & (1 << x)) !== 0) return y + 1;

	return 0;
};

const convertBoard = (seed: number): SimBoard =>
	searchStateOf(openingGame({ board: convertStack(seed), queue: [], seed })).board;

const locksToReady = (opening: WellsOpening): number | null => {
	const stage = wellStage("convert");
	const mover = { handling: DEFAULT_CONFIG.handling, gravity: WELLS_GRAVITY };
	const game = openingGame(opening);

	for (let lock = 1; lock <= WITNESS_LOCKS && !game.isOver; lock++) {
		const spawn = searchStateOf(game);
		const rules = wellsRules(stage, true, spawn.board);
		const before = searchQuadReady(spawn, goalOf(stage), rules, mover, { ...LIVE_BUDGET, deadlineMs: null });
		const pieces = game.stats.pieces;

		game.input(choiceKeys(chooseMove(spawn, before, stage, rules, mover, true)));

		for (let frame = 0; frame < FRAME_LIMIT && game.stats.pieces === pieces; frame++) game.step();

		if (rowsReady(searchStateOf(game).board, goalOf(stage)) === 4) return lock;
	}

	return null;
};

describe("Convert boards", () => {
	it("pins the first board: a 9-0 stack dug by one quad, a judge-passing player converts it", () => {
		const opening = convertOpening(0);

		expect(opening.seed).toBe(CONVERT_SEEDS[0]);
		expect(opening.board.at(-1)).toEqual({ dig: 4 });
		expect(locksToReady(opening)).not.toBeNull();
	});

	it.each(CONVERT_SEEDS)("keeps stack %i a clean, legal, dug-down 9-0 stack", (seed) => {
		const board = convertBoard(seed);
		const dig = convertStack(seed).at(-1);

		expect(dig && "dig" in dig ? dig.dig % 4 : null).toBe(0);
		expect(stackHeight(board)).toBeGreaterThanOrEqual(4);
		expect(stackHeight(board)).toBeLessThanOrEqual(6);
		expect(coveredCells(board)).toBe(0);
		expect(heightOf(board, 9)).toBe(0);
		expect(heightOf(board, 6)).toBeGreaterThanOrEqual(Math.min(heightOf(board, 5), heightOf(board, 7)));
		expect(() =>
			openingGame({ board: [], queue: [], seed }).load({
				board: convertStack(seed),
				validate: true,
				queue: { pieces: [], mode: "fresh-bag" },
				holdEnabled: true,
				seed,
			}),
		).not.toThrow();
	});
});

describe("Eternal garbage", () => {
	it.each([1, 2, 3, 4, 5])("lays 8 permanent rows with one hole each, away from the well (seed %i)", (seed) => {
		const { rows } = searchStateOf(openingGame(openingFor(wellStage("eternal"), seed))).board;
		const holes = Array.from(rows.slice(0, 8), (row) =>
			Array.from({ length: 10 }, (_, x) => x).filter((x) => (row & (1 << x)) === 0),
		);

		expect(holes.every((row) => row.length === 1 && row[0] !== 9)).toBe(true);
		expect(holes.every((row, y) => y === 0 || row[0] !== holes[y - 1]?.[0])).toBe(true);
		expect(rows[8]).toBe(0);
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
