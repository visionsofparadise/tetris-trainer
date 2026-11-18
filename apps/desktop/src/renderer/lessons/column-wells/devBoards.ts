import {
	cellsKey,
	generateMoves,
	Mino,
	placementCells,
	type BoardItem,
	type MoveRules,
	type Piece,
	type Placement,
	type ScriptStep,
} from "@tetris-trainer/game";
import { searchStateOf } from "../../search/searchStateOf";
import { openingGame, type WellsOpening } from "./boards";
import { moverOf } from "./rules";
import type { WellStage, WellStageId } from "./stages";
import type { WellsState } from "./wellsDrill";
import type { Drill, Player } from "../drill/Drill";

export interface DevBoard {
	readonly stage: WellStageId;
	readonly board: ReadonlyArray<BoardItem>;
	readonly queue: ReadonlyArray<Piece>;
	readonly play: Placement;
	readonly lines?: number;
}

const OPEN_RULES: MoveRules = {
	allow180: true,
	excluded: {},
	holeFreeOnly: false,
	ceiling: null,
	quadClearsOnly: false,
	deadRows: 0,
};

const BAG_TAIL: ReadonlyArray<Piece> = [Mino.T, Mino.I, Mino.J, Mino.Z, Mino.S];

const STEP_ROW: ReadonlyArray<BoardItem> = [
	{ mino: Mino.I, orientation: "spawn", column: 0, row: 3 },
	{ mino: Mino.O, orientation: "spawn", column: 4, row: 3 },
];

const ALTERNATING: ReadonlyArray<BoardItem> = [
	{ column: 9, amount: 1 },
	{ mino: Mino.L, orientation: "right", column: 0, row: 1 },
	{ mino: Mino.T, orientation: "left", column: 1, row: 1 },
	{ mino: Mino.Z, orientation: "right", column: 3, row: 1 },
	{ mino: Mino.T, orientation: "spawn", column: 4, row: 1 },
];

export type DevBoardName =
	| "well-blocked"
	| "wrong-side"
	| "hole"
	| "homeless"
	| "slow-count"
	| "non-quad-clear"
	| "over-ceiling"
	| "lines-pass"
	| "convert-pass";

export const DEV_BOARDS: Readonly<Record<DevBoardName, DevBoard>> = {
	"well-blocked": {
		stage: "nine-zero",
		board: [],
		queue: [Mino.O, ...BAG_TAIL],
		play: { mino: Mino.O, orientation: "spawn", column: 8, row: 0 },
	},
	"wrong-side": {
		stage: "six-three",
		board: [],
		queue: [Mino.T, Mino.O, ...BAG_TAIL],
		play: { mino: Mino.T, orientation: "spawn", column: 7, row: 0 },
	},
	hole: {
		stage: "nine-zero",
		board: [],
		queue: [Mino.S, Mino.O, ...BAG_TAIL],
		play: { mino: Mino.S, orientation: "spawn", column: 0, row: 0 },
	},
	homeless: {
		stage: "nine-zero",
		board: ALTERNATING,
		queue: [Mino.I, Mino.O, ...BAG_TAIL],
		play: { mino: Mino.I, orientation: "right", column: 8, row: 1 },
	},
	"slow-count": {
		stage: "nine-zero",
		board: [{ column: 9, amount: 3 }, ...STEP_ROW],
		queue: [Mino.L, Mino.O, ...BAG_TAIL],
		play: { mino: Mino.L, orientation: "spawn", column: 0, row: 4 },
	},
	"non-quad-clear": {
		stage: "convert",
		board: [
			{ column: 9, amount: 2 },
			{ mino: Mino.J, orientation: "spawn", column: 0, row: 2 },
		],
		queue: [Mino.I, Mino.O, ...BAG_TAIL],
		play: { mino: Mino.I, orientation: "right", column: 9, row: 0 },
	},
	"over-ceiling": {
		stage: "eternal",
		board: [
			...[3, 5, 2, 7, 4, 6, 3, 5].map((column) => ({ column, amount: 1 })),
			{ mino: Mino.I, orientation: "right", column: 0, row: 8 },
			{ mino: Mino.J, orientation: "spawn", column: 1, row: 8 },
		],
		queue: [Mino.I, Mino.O, ...BAG_TAIL],
		play: { mino: Mino.I, orientation: "right", column: 0, row: 12 },
	},
	"lines-pass": {
		stage: "nine-zero",
		board: [{ column: 9, amount: 4 }],
		queue: [Mino.I, Mino.O, ...BAG_TAIL],
		play: { mino: Mino.I, orientation: "right", column: 9, row: 0 },
		lines: 36,
	},
	"convert-pass": {
		stage: "convert",
		board: [{ column: 6, amount: 3 }, ...STEP_ROW],
		queue: [Mino.L, Mino.O, ...BAG_TAIL],
		play: { mino: Mino.L, orientation: "spawn", column: 7, row: 3 },
	},
};

const DEV_SEED = 1;

export const devOpening = (dev: DevBoard): WellsOpening => ({ board: dev.board, queue: dev.queue, seed: DEV_SEED });

const isDevName = (name: string): name is DevBoardName => name in DEV_BOARDS;

export const devKeys = (dev: DevBoard, opening: WellsOpening, player: Player): ReadonlyArray<ScriptStep> => {
	const { board } = searchStateOf(openingGame(opening, player.handling));
	const target = cellsKey(placementCells(dev.play));
	const move = generateMoves(board, dev.play.mino, OPEN_RULES, moverOf(player)).find(
		({ cells }) => cellsKey(cells) === target,
	);

	return move?.keys ?? [];
};

export const withDevBoard = (
	drill: Drill<WellsState, WellStage>,
	name: string | null,
): Drill<WellsState, WellStage> => {
	if (name === null || !isDevName(name)) return drill;

	const dev = DEV_BOARDS[name];
	const opening = devOpening(dev);
	const isDev = (state: WellsState): boolean => state.opening === opening;

	return {
		...drill,
		start: (start, seed) => {
			const state = drill.start(start, seed);

			return start.id === dev.stage ? { ...state, opening } : state;
		},
		deal: (state, player, round) => {
			const dealt = drill.deal(state, player, round);

			return isDev(dealt.state) ? { ...dealt, state: { ...dealt.state, lines: dev.lines ?? 0 } } : dealt;
		},
		describe: (state, player) => {
			const base = JSON.parse(drill.describe(state, player)) as object;

			return JSON.stringify(isDev(state) ? { ...base, play: devKeys(dev, opening, player) } : base);
		},
	};
};
