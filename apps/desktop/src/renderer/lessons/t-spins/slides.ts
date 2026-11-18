import { Mino, placementCells, type Block, type Placement } from "@tetris-trainer/game";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { Slide } from "../opener/Opener";

export const DOUBLE_BOARD = ["XXXX......", "XXX...XXXX", "XXXX.XXXXX"];

export const DOUBLE_T: Placement = { mino: Mino.T, orientation: "reverse", column: 3, row: 0 };

export const SINGLE_BOARD = ["XXXX......", "XXX...XX.X", "XXXX.XXXXX"];

export const MINI_BOARD = ["....XXXXXX", "X..XXXXXXX", "...XXXXXXX"];

export const MINI_T: Placement = { mino: Mino.T, orientation: "spawn", column: 0, row: 0 };

export const TRIPLE_BOARD = ["XXXX......", "XXX.......", "XXX.XXXXXX", "XXX..XXXXX", "XXX.XXXXXX"];

export const TRIPLE_T: Placement = { mino: Mino.T, orientation: "right", column: 3, row: 0 };

const OVERHANG: ReadonlyArray<Block> = [[3, 2]];

const FILLED_CORNERS: ReadonlyArray<Block> = [
	[3, 0],
	[5, 0],
	[3, 2],
];

const OPEN_CORNER: ReadonlyArray<Block> = [[5, 2]];

const MINI_FILLED: ReadonlyArray<Block> = [[0, 1]];

const MINI_OPEN: ReadonlyArray<Block> = [[2, 1]];

const GAP: ReadonlyArray<Block> = [[8, 1]];

const TRIPLE_OVERHANG: ReadonlyArray<Block> = [[3, 4]];

const UNDER: Placement = { mino: Mino.T, orientation: "spawn", column: 3, row: 3 };

const tint = (cells: ReadonlyArray<Block>): BoardOverlay => ({ kind: "tint", cells, tone: "lime" });

const ghost = (cells: ReadonlyArray<Block>, tone: "lime" | "pink", label: string | null): BoardOverlay => ({
	kind: "ghost",
	cells,
	tone,
	label,
});

export const T_SPIN_SLIDES: ReadonlyArray<Slide> = [
	{
		title: "The slot",
		notes: [
			{ text: "An overhang over a T-shaped hole makes a T-slot.", aims: [OVERHANG] },
			{ text: "The T turns in under it for a T-spin double, which clears two lines and sends 4.", aims: [DOUBLE_T] },
		],
		board: [{ rows: DOUBLE_BOARD }],
		marks: [DOUBLE_T],
	},
	{
		title: "Corners",
		notes: [
			{ text: "A T-spin needs 3 of the 4 cells diagonal to the T's centre filled.", aims: [FILLED_CORNERS] },
			{ text: "The turn must be the T's last move: dropping after it loses the spin.", aims: [DOUBLE_T] },
		],
		board: [{ rows: DOUBLE_BOARD }],
		marks: [DOUBLE_T],
		overlays: [tint(FILLED_CORNERS), ghost(OPEN_CORNER, "pink", null)],
	},
	{
		title: "Mini",
		notes: [
			{ text: "The spin is full when both corners on the T's pointed side are filled.", aims: [MINI_FILLED] },
			{ text: "With one of them open it is a mini, and a mini single sends 0.", aims: [MINI_OPEN] },
		],
		board: [{ rows: MINI_BOARD }],
		marks: [MINI_T],
		overlays: [tint(MINI_FILLED), ghost(MINI_OPEN, "pink", null)],
	},
	{
		title: "Single",
		notes: [
			{ text: "A gap in the slot's top row keeps that row from clearing.", aims: [GAP] },
			{ text: "The same spin then clears one line, a T-spin single, which sends 2.", aims: [DOUBLE_T] },
		],
		board: [{ rows: SINGLE_BOARD }],
		marks: [DOUBLE_T],
		overlays: [ghost(GAP, "pink", null)],
	},
	{
		title: "Triple",
		notes: [
			{ text: "Slide the T in under the overhang.", aims: [UNDER] },
			{
				text: "The overhang blocks the earlier kicks, so the turn takes the last one, two rows down.",
				aims: [TRIPLE_OVERHANG],
			},
			{ text: "That is a T-spin triple, which sends 6.", aims: [TRIPLE_T] },
		],
		board: [{ rows: TRIPLE_BOARD }],
		marks: [TRIPLE_T],
		overlays: [ghost(placementCells(UNDER), "lime", "1"), ghost(placementCells(TRIPLE_T), "lime", "2")],
	},
];
