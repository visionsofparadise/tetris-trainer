import {
	lockCells,
	Mino,
	placementCells,
	simBoardOf,
	type Block,
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

const ghosts = (placements: ReadonlyArray<Placement>): ReadonlyArray<BoardOverlay> =>
	placements.map((placement) => ({
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

const SPAWN_BOX: ReadonlyArray<Block> = [
	[3, 20],
	[4, 20],
	[5, 20],
	[3, 21],
	[4, 21],
	[5, 21],
];

const SHORT_CELL: ReadonlyArray<Block> = [[8, 3]];

const SLOT_T: Placement = { mino: Mino.T, orientation: "reverse", column: 1, row: 4 };

const BRIDGE_O: Placement = { mino: Mino.O, orientation: "spawn", column: SIX_THREE_WELL, row: 4 };

const OPEN_WELL: ReadonlyArray<Block> = [
	[SIX_THREE_WELL, 0],
	[SIX_THREE_WELL, 1],
	[SIX_THREE_WELL, 2],
	[SIX_THREE_WELL, 3],
];

const LEFT_I: Placement = { mino: Mino.I, orientation: "spawn", column: 2, row: 2 };

const LEFT_T: Placement = { mino: Mino.T, orientation: "spawn", column: 2, row: 3 };

const SPIKE_I: ReadonlyArray<Block> = [
	[9, 4],
	[9, 5],
	[9, 6],
	[9, 7],
];

const FLAT_BOX = placed([
	[Mino.L, "spawn", 7, 0],
	[Mino.O, "spawn", 7, 1],
	[Mino.J, "reverse", 7, 2],
]);

const CLOSED_BOX = placed([
	[Mino.J, "spawn", 7, 4],
	[Mino.S, "right", 7, 5],
	[Mino.L, "left", 8, 5],
]);

const cellsOf = (placements: ReadonlyArray<Placement>): ReadonlyArray<Block> => placements.flatMap(placementCells);

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
				text: "J, L, S, T and Z spawn in these three columns, closer to the left, so a well on the right means less travel.",
				aims: [SPAWN_T],
			},
			{ text: "Only the I goes in the well, and here it clears four rows.", aims: [WELL_I] },
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
			[Mino.I, "spawn", 3, 3],
		]),
		marks: [WELL_I, SPAWN_T],
		overlays: [wellTint(NINE_ZERO_WELL), { kind: "tint", cells: SPAWN_BOX, tone: "lime" }],
	},
	{
		title: "Beside the well",
		notes: [
			{ text: "One cell short beside the well, the I clears three rows, not four.", aims: [WELL_I] },
			{ text: "So the column beside the well stays level with the stack.", aims: [SHORT_CELL] },
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
		overlays: [wellTint(NINE_ZERO_WELL), { kind: "ghost", cells: SHORT_CELL, tone: "pink", label: null }],
	},
	{
		title: "Why 6-3",
		notes: [
			{ text: "6-3 leaves the well in the seventh column.", aims: [OPEN_WELL] },
			{
				text: "A flat six-side forms T-spin setups at the top: this T spins in and clears two rows.",
				aims: [SLOT_T],
			},
			{
				text: "The O bridges the well for it. This lesson keeps the well open and clears by quads, so T-spins come later.",
				aims: [BRIDGE_O],
			},
		],
		board: placed([
			[Mino.O, "spawn", 0, 0],
			[Mino.O, "spawn", 2, 0],
			[Mino.I, "right", 4, 0],
			[Mino.I, "right", 5, 0],
			[Mino.Z, "right", 7, 0],
			[Mino.J, "left", 8, 0],
			[Mino.L, "reverse", 0, 2],
			[Mino.L, "spawn", 1, 2],
			[Mino.Z, "right", 7, 2],
			[Mino.L, "left", 8, 3],
			[Mino.L, "right", 0, 4],
			[Mino.T, "spawn", 3, 4],
			[Mino.O, "spawn", 6, 4],
			[Mino.J, "reverse", 3, 5],
		]),
		marks: [SLOT_T],
		overlays: [wellTint(SIX_THREE_WELL)],
	},
	{
		title: "The three-side",
		notes: [
			{ text: "L, O and J build the three-wide side quickly.", aims: [cellsOf(FLAT_BOX)] },
			{
				text: "Three pieces fill each 3×4 box, so the side comes out flat every four rows.",
				aims: [cellsOf(CLOSED_BOX)],
			},
		],
		board: placed([
			[Mino.Z, "right", 0, 0],
			[Mino.I, "spawn", 1, 0],
			[Mino.S, "right", 4, 0],
			[Mino.O, "spawn", 2, 1],
			[Mino.L, "reverse", 0, 2],
			[Mino.J, "reverse", 3, 2],
		]),
		marks: [],
		overlays: [wellTint(SIX_THREE_WELL), ...ghosts([...FLAT_BOX, ...CLOSED_BOX])],
	},
	{
		title: "T and I go left",
		notes: [
			{ text: "An I lies flat only across four columns: on the three-side it stands as a spike.", aims: [SPIKE_I] },
			{ text: "So the I goes on the six-side.", aims: [LEFT_I] },
			{ text: "The T goes there too, where the six-side's T-spin setups take it.", aims: [LEFT_T] },
		],
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
		overlays: [wellTint(SIX_THREE_WELL), { kind: "ghost", cells: SPIKE_I, tone: "pink", label: null }],
	},
	{
		title: "Count to 4",
		notes: [{ text: "Count the complete rows above the well floor. At four, the I clears a quad.", aims: [] }],
		board: COUNT_BOARD,
		marks: [],
		overlays: [wellTint(NINE_ZERO_WELL), countOf(COUNT_BOARD)],
	},
];
