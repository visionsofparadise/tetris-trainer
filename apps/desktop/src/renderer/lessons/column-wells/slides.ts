import {
	lockCells,
	Mino,
	placementCells,
	simBoardOf,
	type Orientation,
	type Piece,
	type Placement,
} from "@tetris-trainer/game";
import { fourCount, wellTint } from "./overlays";
import { NINE_ZERO_WELL, SIX_THREE_WELL, wellStage } from "./stages";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { Slide } from "../opener/Opener";

type PlacementRow = readonly [Piece, Orientation, number, number];

const placed = (rows: ReadonlyArray<PlacementRow>): ReadonlyArray<Placement> =>
	rows.map(([mino, orientation, column, row]) => ({ mino, orientation, column, row }));

const ghosts = (rows: ReadonlyArray<PlacementRow>): ReadonlyArray<BoardOverlay> =>
	placed(rows).map((placement) => ({
		kind: "ghost",
		cells: placementCells(placement),
		tone: "lime",
		label: placement.mino.toUpperCase(),
	}));

const countOf = (board: ReadonlyArray<Placement>): BoardOverlay =>
	fourCount(
		board.reduce((stack, placement) => lockCells(stack, placementCells(placement), "none").board, simBoardOf([])),
		wellStage("nine-zero"),
	);

const WELL_I: Placement = { mino: Mino.I, orientation: "right", column: NINE_ZERO_WELL, row: 0 };

const SPAWN_T: Placement = { mino: Mino.T, orientation: "spawn", column: 3, row: 20 };

const SLOT_T: Placement = { mino: Mino.T, orientation: "reverse", column: 1, row: 3 };

const LEFT_I: Placement = { mino: Mino.I, orientation: "spawn", column: 2, row: 2 };

const LEFT_T: Placement = { mino: Mino.T, orientation: "spawn", column: 2, row: 3 };

const COUNT_BOARD = placed([
	[Mino.J, "spawn", 0, 0],
	[Mino.T, "spawn", 3, 0],
	[Mino.L, "spawn", 6, 0],
	[Mino.T, "spawn", 1, 1],
	[Mino.T, "right", 5, 1],
	[Mino.S, "spawn", 6, 1],
	[Mino.O, "spawn", 0, 2],
	[Mino.O, "spawn", 3, 2],
]);

export const WELLS_SLIDES: ReadonlyArray<Slide> = [
	{
		title: "The right well",
		notes: [
			{
				text: "Every piece but I and O spawns left of centre, so a right well means less travel.",
				aims: [SPAWN_T],
			},
			{ text: "The well takes the right column, and only an I goes in it.", aims: [WELL_I] },
		],
		board: placed([
			[Mino.J, "spawn", 0, 0],
			[Mino.Z, "spawn", 2, 0],
			[Mino.T, "spawn", 5, 0],
			[Mino.T, "left", 7, 0],
			[Mino.S, "right", 0, 1],
			[Mino.O, "spawn", 4, 1],
			[Mino.Z, "spawn", 1, 2],
			[Mino.S, "spawn", 6, 2],
		]),
		marks: [WELL_I, SPAWN_T],
		overlays: [wellTint(NINE_ZERO_WELL)],
	},
	{
		title: "Beside the well",
		notes: [
			{ text: "The column beside the well stays as flat as the stack.", aims: [] },
			{ text: "One cell short there, the I clears three rows instead of four.", aims: [WELL_I] },
		],
		board: placed([
			[Mino.L, "spawn", 0, 0],
			[Mino.Z, "right", 3, 0],
			[Mino.S, "spawn", 4, 0],
			[Mino.T, "spawn", 6, 0],
			[Mino.O, "spawn", 0, 1],
			[Mino.J, "reverse", 6, 1],
			[Mino.S, "spawn", 2, 2],
			[Mino.L, "reverse", 5, 2],
			[Mino.J, "spawn", 0, 3],
		]),
		marks: [WELL_I],
		overlays: [wellTint(NINE_ZERO_WELL), { kind: "ghost", cells: [[8, 3]], tone: "pink", label: null }],
	},
	{
		title: "Why 6-3",
		notes: [
			{ text: "6-3 leaves the well in the seventh column.", aims: [] },
			{ text: "A flat six-side forms T-spin setups at the top of the stack.", aims: [SLOT_T] },
		],
		board: placed([
			[Mino.J, "spawn", 0, 0],
			[Mino.Z, "spawn", 2, 0],
			[Mino.S, "right", 4, 0],
			[Mino.O, "spawn", 7, 0],
			[Mino.L, "left", 8, 0],
			[Mino.L, "reverse", 1, 1],
			[Mino.T, "right", 0, 2],
			[Mino.J, "reverse", 3, 2],
			[Mino.L, "reverse", 7, 2],
			[Mino.Z, "spawn", 3, 4],
		]),
		marks: [SLOT_T],
		overlays: [wellTint(SIX_THREE_WELL)],
	},
	{
		title: "The three-side",
		notes: [{ text: "J, L, S, Z and O fill the three-side, three pieces to each 3×4 box.", aims: [] }],
		board: placed([
			[Mino.Z, "right", 0, 0],
			[Mino.I, "spawn", 1, 0],
			[Mino.S, "right", 4, 0],
			[Mino.O, "spawn", 2, 1],
			[Mino.L, "reverse", 0, 2],
			[Mino.J, "reverse", 3, 2],
		]),
		marks: [],
		overlays: [
			wellTint(SIX_THREE_WELL),
			...ghosts([
				[Mino.Z, "right", 7, 0],
				[Mino.J, "left", 8, 0],
				[Mino.L, "reverse", 7, 2],
				[Mino.L, "spawn", 7, 4],
				[Mino.S, "spawn", 7, 5],
				[Mino.L, "reverse", 7, 6],
			]),
		],
	},
	{
		title: "T and I go left",
		notes: [{ text: "T and I go on the six-side.", aims: [LEFT_T, LEFT_I] }],
		board: placed([
			[Mino.L, "right", 0, 0],
			[Mino.J, "spawn", 2, 0],
			[Mino.J, "reverse", 3, 0],
			[Mino.Z, "right", 7, 0],
			[Mino.J, "left", 8, 0],
			[Mino.L, "left", 0, 1],
			[Mino.L, "reverse", 7, 2],
		]),
		marks: [LEFT_I, LEFT_T],
		overlays: [wellTint(SIX_THREE_WELL)],
	},
	{
		title: "Count to 4",
		notes: [{ text: "Count the complete rows above the well floor. At four, the I clears a quad.", aims: [] }],
		board: COUNT_BOARD,
		marks: [],
		overlays: [wellTint(NINE_ZERO_WELL), countOf(COUNT_BOARD)],
	},
];
