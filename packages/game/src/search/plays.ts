import { Mino, RNG, type Tile } from "@haelp/teto/engine";
import { DEFAULT_CONFIG, DEMO_HANDLING } from "../config";
import { BOARD_COLUMNS } from "../engineOptions";
import { Game, type GameSnapshot } from "../Game";
import { placementCells, type Piece } from "../pieces";
import { BOARD_ROWS, emptySimBoard, lockCells, simBoardOf, type SimBoard } from "../sim/simBoard";
import { cleanStack } from "./cleanStack";
import type { Move, Mover, MoveRules } from "./moves";
import type { PlaceEvent } from "../events";

export interface NamedBoard {
	readonly name: string;
	readonly board: SimBoard;
}

export const OPEN_RULES: MoveRules = {
	allow180: true,
	excluded: {},
	holeFreeOnly: false,
	ceiling: null,
	quadClearsOnly: false,
};

export const ZERO_GRAVITY: Mover = { handling: DEMO_HANDLING, gravity: 0 };

export const MOVERS: ReadonlyArray<readonly [string, Mover]> = [
	["demo handling at 0G", ZERO_GRAVITY],
	["demo handling at 0.02G", { handling: DEMO_HANDLING, gravity: 0.02 }],
	["default handling at 0.02G", { handling: DEFAULT_CONFIG.handling, gravity: 0.02 }],
];

const PLAY_FRAMES = 2000;

const HOLE_ROWS = 6;

const boardOf = (rows: ReadonlyArray<string>): SimBoard => {
	const board = emptySimBoard();

	rows.forEach((row, index) => {
		const y = rows.length - 1 - index;

		for (let x = 0; x < row.length; x++) if (row[x] === "#") board.rows[y] = (board.rows[y] ?? 0) | (1 << x);
	});

	return board;
};

const stackBoard = (seed: number, well: number | null): SimBoard =>
	cleanStack(seed, 30, 12, well).reduce(
		(board, placement) => lockCells(board, placementCells(placement), "none").board,
		emptySimBoard(),
	);

const holeBoard = (seed: number): SimBoard => {
	const rng = new RNG(seed);
	const board = emptySimBoard();
	const height = 3 + Math.floor(rng.nextFloat() * (HOLE_ROWS - 2));

	for (let y = 0; y < height; y++)
		for (let x = 0; x < BOARD_COLUMNS; x++)
			if (rng.nextFloat() < 0.75 - y * 0.08) board.rows[y] = (board.rows[y] ?? 0) | (1 << x);

	return board;
};

export const SPIN_BOARDS: ReadonlyArray<NamedBoard> = [
	{ name: "TSD", board: boardOf(["####......", "###...####", "####.#####"]) },
	{ name: "TST", board: boardOf(["....######", ".....#####", "####.#####", "###..#####", "####.#####"]) },
	{
		name: "fin",
		board: boardOf(["#.#..####.", "#.#.....##", "#..#....#.", ".####.....", ".....##.##", "##.#.#.###"]),
	},
	{ name: "S spin", board: boardOf([".####..#..", ".#.####...", ".#####.##.", "######.#..", "##########"]) },
	{ name: "Z spin", board: boardOf(["##..##....", ".###.#....", ".#####..##", "#.#.###..#", "##########"]) },
	{ name: "L and J spins", board: boardOf([".###..#...", "##.#..#...", "#.###.##.#", "####..#...", "##########"]) },
	{ name: "I spin", board: boardOf(["...#.##.#.", "##....####", "#..#...##.", "#..###..##", "##########"]) },
	{ name: "tuck", board: boardOf(["####......", ".........."]) },
];

export const STACK_BOARDS: ReadonlyArray<NamedBoard> = [
	...Array.from({ length: 100 }, (_, index) => ({
		name: `stack ${index + 1}`,
		board: stackBoard(index + 1, null),
	})),
	...Array.from({ length: 50 }, (_, index) => ({
		name: `well stack ${index + 101}`,
		board: stackBoard(index + 101, BOARD_COLUMNS - 1),
	})),
];

export const HOLE_BOARDS: ReadonlyArray<NamedBoard> = Array.from({ length: 25 }, (_, index) => ({
	name: `holes ${index + 1}`,
	board: holeBoard(index + 1),
}));

export const chunks = <T>(items: ReadonlyArray<T>, size: number): Array<ReadonlyArray<T>> =>
	Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

const boardTiles = (board: SimBoard): Array<Array<Tile>> =>
	Array.from({ length: BOARD_ROWS }, (_, y) =>
		Array.from({ length: BOARD_COLUMNS }, (_, x): Tile =>
			((board.rows[y] ?? 0) & (1 << x)) === 0 ? null : { mino: Mino.GARBAGE, connections: 0 },
		),
	);

export const loadBoard = (
	board: SimBoard,
	mino: Piece,
	mover: Mover,
): { readonly game: Game; readonly start: GameSnapshot } => {
	const game = new Game(mover.handling, 1);

	game.setGravity(mover.gravity);
	game.load({ board: [], validate: false, queue: { pieces: [mino], mode: "any" }, holdEnabled: false, seed: 1 });

	const loaded = game.snapshot();

	game.restore({ ...loaded, engine: { ...loaded.engine, board: boardTiles(board) } });

	return { game, start: game.snapshot() };
};

export const playMove = (
	game: Game,
	start: GameSnapshot,
	move: Move,
): { readonly placed: PlaceEvent | null; readonly board: SimBoard } => {
	const played: { placed: PlaceEvent | null } = { placed: null };

	game.restore(start);

	const off = game.on("place", (event) => (played.placed ??= event));

	game.input(move.keys);

	for (let frame = 0; played.placed === null && frame < PLAY_FRAMES; frame++) game.step();

	off();

	return { placed: played.placed, board: simBoardOf(game.board) };
};
