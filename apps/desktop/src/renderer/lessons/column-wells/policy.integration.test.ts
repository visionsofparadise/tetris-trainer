import {
	DEFAULT_CONFIG,
	DEMO_HANDLING,
	generateMoves,
	lockCells,
	Mino,
	searchQuadReady,
	simBoardOf,
	type Piece,
	type SimBoard,
} from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { searchStateOf } from "../../search/searchStateOf";
import { openingGame } from "./boards";
import { coveredCells } from "./boardFacts";
import { DEV_BOARDS, devOpening } from "./devBoards";
import { candidatesFor, chooseMove, choiceKeys, pickMove } from "./policy";
import { goalOf, wellsRules, WELLS_GRAVITY } from "./rules";
import { wellStage, type WellStageId } from "./stages";
import { watchGame } from "./watch";

const MOVER = { handling: DEFAULT_CONFIG.handling, gravity: WELLS_GRAVITY };

const WATCH_MOVER = { handling: DEMO_HANDLING, gravity: WELLS_GRAVITY };

const BUDGET = { nodes: 5000, depth: 6, deadlineMs: null };

const PLAY_LOCKS = 30;

const FRAME_LIMIT = 900;

const boardOf = (rows: ReadonlyArray<string>): SimBoard =>
	simBoardOf([...rows].reverse().map((row) => [...row].map((cell) => (cell === "#" ? Mino.GARBAGE : null))));

const picked = (board: SimBoard, mino: Piece, stageId: WellStageId) => {
	const stage = wellStage(stageId);
	const rules = wellsRules(stage, true);

	return pickMove(candidatesFor(board, mino, stage, rules, MOVER), board, goalOf(stage), rules);
};

const quadsIn = (stageId: WellStageId, seed: number): number => {
	const stage = wellStage(stageId);
	const rules = wellsRules(stage, true);
	const game = watchGame(seed);
	let quads = 0;

	game.on("place", ({ lines }) => (quads += lines === 4 ? 1 : 0));

	for (let lock = 0; lock < PLAY_LOCKS && !game.isOver; lock++) {
		const spawn = searchStateOf(game);
		const before = searchQuadReady(spawn, goalOf(stage), rules, WATCH_MOVER, BUDGET);
		const pieces = game.stats.pieces;

		game.input(choiceKeys(chooseMove(spawn, before, stage, rules, WATCH_MOVER, true)));

		for (let frame = 0; frame < FRAME_LIMIT && game.stats.pieces === pieces; frame++) game.step();
	}

	return quads;
};

describe("pickMove", () => {
	it("takes a hole-free move over one that covers a cell", () => {
		const board = boardOf(["##.......", "###......"]);
		const move = picked(board, Mino.S, "nine-zero");

		expect(move && coveredCells(lockCells(board, move.cells, move.spin).added)).toBe(0);
	});

	it("takes the quad on a ready stack", () => {
		const board = boardOf(["#########.", "#########.", "#########.", "#########."]);

		expect(picked(board, Mino.I, "nine-zero")?.lines).toBe(4);
	});

	it("keeps homes for more piece types", () => {
		const dev = DEV_BOARDS.homeless;
		const board = searchStateOf(openingGame(devOpening(dev))).board;
		const move = picked(board, Mino.I, "nine-zero");

		expect(move?.placement).not.toEqual(dev.play);
	});

	it("keeps the six-side for the app's three-side pieces when the three-side has room", () => {
		const stage = wellStage("six-side");
		const spawn = searchStateOf(openingGame({ board: [], queue: [Mino.L, Mino.O, Mino.T], seed: 1 }));
		const choice = chooseMove(spawn, { kind: "beyond", nodes: 0 }, stage, wellsRules(stage, true), MOVER, false);

		expect(choice?.move.cells.every(([x]) => x >= 7)).toBe(true);
		expect(generateMoves(spawn.board, Mino.L, wellsRules(stage, true), MOVER).length).toBeGreaterThan(0);
	});
});

describe("policy play", () => {
	it.each([1, 2, 3, 4, 5])("completes a quad within 30 pieces in 9-0 and 6-3 (seed %i)", (seed) => {
		expect(quadsIn("nine-zero", seed)).toBeGreaterThan(0);
		expect(quadsIn("six-three", seed)).toBeGreaterThan(0);
	});
});
