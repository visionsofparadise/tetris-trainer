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
	type SimBoard,
} from "@tetris-trainer/game";
import { stackHeight } from "./boardFacts";
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

const CONVERT_TOP = 6;

const QUAD_LINES = 4;

const OLD_WELL_ROW = 0b0111111111;

const GARBAGE_ROWS = 8;

export const CONVERT_SEEDS: ReadonlyArray<number> = [
	2, 3, 4, 5, 6, 7, 9, 10, 11, 13, 14, 17, 19, 21, 24, 25, 26, 28, 29, 32, 33, 34, 35, 37,
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

const convertDig = (board: SimBoard): number => {
	const ready = board.rows.findIndex((row) => row !== OLD_WELL_ROW);
	const height = stackHeight(board);
	const dig = Math.max(QUAD_LINES, Math.ceil((height - CONVERT_TOP) / QUAD_LINES) * QUAD_LINES);

	return dig <= ready ? dig : 0;
};

export const convertStack = (stackSeed: number): ReadonlyArray<BoardItem> => {
	const placements = cleanStack(stackSeed, CONVERT_DEALS, CONVERT_CAP, NINE_ZERO_WELL);
	const board = placements.reduce(
		(stack, placement) => lockCells(stack, placementCells(placement), "none").board,
		simBoardOf([]),
	);
	const dig = convertDig(board);

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

const eternalGarbage = (seed: number): ReadonlyArray<BoardItem> => {
	const columns: Array<number> = [];

	for (let value = nextSeed(seed); columns.length < GARBAGE_ROWS; value = nextSeed(value)) {
		const column = value % NINE_ZERO_WELL;

		if (column !== columns.at(-1)) columns.push(column);
	}

	return columns.map((column) => ({ column, amount: 1 }));
};

const eternalOpening = (seed: number): WellsOpening => cleanOpening(eternalGarbage(seed), seed);

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
