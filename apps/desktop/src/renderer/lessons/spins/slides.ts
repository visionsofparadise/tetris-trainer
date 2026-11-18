import { Mino, placementCells, type Block, type Placement } from "@tetris-trainer/game";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { Slide } from "../opener/Opener";

export const Z_BOARD = [".....XX...", "XXX..XXX.X", "XXX..XXXXX", "XXXX..XXXX"];

export const Z_SPIN: Placement = { mino: Mino.Z, orientation: "reverse", column: 3, row: 0 };

const Z_BEFORE: ReadonlyArray<Block> = [
	[4, 3],
	[4, 2],
	[3, 2],
	[3, 1],
];

export const J_BOARD = ["........X.", "X..X..XXX.", "XX...XXXXX", "XXXX.XXXXX"];

export const J_SPIN: Placement = { mino: Mino.J, orientation: "reverse", column: 2, row: 0 };

const J_BEFORE: ReadonlyArray<Block> = [
	[3, 3],
	[2, 3],
	[2, 2],
	[2, 1],
];

const ghost = (cells: ReadonlyArray<Block>, label: string): BoardOverlay => ({
	kind: "ghost",
	cells,
	tone: "lime",
	label,
});

export const SPIN_SLIDES: ReadonlyArray<Slide> = [
	{
		title: "Kicks",
		notes: [
			{
				text: "A turn tries the plain rotation, then four kicks in a fixed order, and takes the first that fits.",
				aims: [Z_BEFORE],
			},
			{
				text: "Here the plain turn and the first kick are blocked, so the second kick moves the Z one right and one down.",
				aims: [Z_SPIN],
			},
		],
		board: [{ rows: Z_BOARD }],
		marks: [Z_SPIN],
		overlays: [ghost(Z_BEFORE, "1"), ghost(placementCells(Z_SPIN), "2")],
	},
	{
		title: "Spins",
		notes: [
			{
				text: "In TETR.IO any piece that turns last into a spot it cannot leave, left, right or up, scores a spin.",
				aims: [J_SPIN],
			},
			{
				text: "Spins by pieces other than the T count as minis: no extra lines, but they keep back-to-back.",
				aims: [],
			},
		],
		board: [{ rows: J_BOARD }],
		marks: [J_SPIN],
		overlays: [ghost(J_BEFORE, "1"), ghost(placementCells(J_SPIN), "2")],
	},
];
