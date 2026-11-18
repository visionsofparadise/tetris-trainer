import {
	cleanStack,
	DEFAULT_CONFIG,
	Game,
	lockCells,
	Mino,
	placementCells,
	simBoardOf,
	type BoardItem,
	type GameSetup,
	type Piece,
} from "@tetris-trainer/game";
import { WELLS_GRAVITY } from "./rules";
import { NINE_ZERO_WELL, type WellStage } from "./stages";

export interface WellsOpening {
	readonly board: ReadonlyArray<BoardItem>;
	readonly queue: ReadonlyArray<Piece>;
	readonly seed: number;
}

const MODULUS = 2147483647;

const MULTIPLIER = 16807;

const CONVERT_DEALS = 40;

const CONVERT_CAP = 10;

const OLD_WELL_ROW = 0b0111111111;

const GARBAGE_ROWS = 8;

export const CONVERT_SEEDS: ReadonlyArray<number> = [
	104, 297, 577, 725, 1238, 1266, 1408, 1512, 1630, 1776, 2029, 2040, 2112, 2148, 2192, 2223, 2277, 2308, 2379, 2442,
	2526, 2618, 2705, 2810,
];

export const nextSeed = (seed: number): number => (seed * MULTIPLIER) % MODULUS;

const wellsSetup = ({ board, queue, seed }: WellsOpening): GameSetup => ({
	board,
	validate: false,
	queue: { pieces: queue, mode: queue.length > 0 ? "any" : "fresh-bag" },
	holdEnabled: true,
	seed,
});

export const openingGame = (opening: WellsOpening, handling = DEFAULT_CONFIG.handling): Game => {
	const game = new Game(handling, opening.seed);

	game.setGravity(WELLS_GRAVITY);
	game.load(wellsSetup(opening));

	return game;
};

export const convertStack = (stackSeed: number): ReadonlyArray<BoardItem> => {
	const placements = cleanStack(stackSeed, CONVERT_DEALS, CONVERT_CAP, NINE_ZERO_WELL);
	const { rows } = placements.reduce(
		(stack, placement) => lockCells(stack, placementCells(placement), "none").board,
		simBoardOf([]),
	);
	const dig = rows.findIndex((row) => row !== OLD_WELL_ROW);

	return dig > 0 ? [...placements, { dig }] : placements;
};

export const convertOpening = (seed: number): WellsOpening => {
	const stackSeed = CONVERT_SEEDS[seed % CONVERT_SEEDS.length];

	if (stackSeed === undefined) throw new Error("Column wells has no Convert boards");

	return { board: convertStack(stackSeed), queue: [], seed: stackSeed };
};

const SKEW_PIECES: ReadonlyArray<Mino> = [Mino.S, Mino.Z];

const opensSkewed = (opening: WellsOpening): boolean => {
	const game = openingGame(opening);

	return [game.falling.mino, ...game.next.slice(0, 1)].every((mino) => SKEW_PIECES.includes(mino));
};

export const cleanOpening = (board: ReadonlyArray<BoardItem>, seed: number): WellsOpening => {
	let opening: WellsOpening = { board, queue: [], seed };

	while (opensSkewed(opening)) opening = { ...opening, seed: nextSeed(opening.seed) };

	return opening;
};

const eternalOpening = (seed: number): WellsOpening =>
	cleanOpening([{ column: NINE_ZERO_WELL, amount: GARBAGE_ROWS }], seed);

export const emptyOpening = (seed: number): WellsOpening => cleanOpening([], seed);

export const openingFor = (stage: WellStage, seed: number): WellsOpening => {
	switch (stage.start) {
		case "empty":
			return emptyOpening(seed);
		case "convert":
			return convertOpening(seed);
		case "eternal":
			return eternalOpening(seed);
	}
};
