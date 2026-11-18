import { Mino, placementCells, type Block, type Placement } from "@tetris-trainer/game";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { Slide } from "../opener/Opener";

const OPEN_BOARD = ["XXX...XXXX", "XXXX.XXXXX", "XXXXXX.XXX"];

const OPEN_T: Placement = { mino: Mino.T, orientation: "reverse", column: 3, row: 1 };

const COVERED_BOARD = [
	"........X.",
	"....XXX.X.",
	"XX...XXXXX",
	"XX...XXXXX",
	"XXX..XXXXX",
	"XXXXXX.XXX",
	"XXXXXXX.XX",
];

const COVERED_T: Placement = { mino: Mino.T, orientation: "left", column: 3, row: 2 };

const BESIDE_T: Placement = { ...COVERED_T, column: 2 };

const ON_TOP: Placement = { ...COVERED_T, row: 6 };

const OVERHANG: ReadonlyArray<Block> = [
	[4, 5],
	[5, 5],
	[6, 5],
];

const ghost = (placement: Placement, tone: "lime" | "pink", label: string | null): BoardOverlay => ({
	kind: "ghost",
	cells: placementCells(placement),
	tone,
	label,
});

export const DROP_SLIDES: ReadonlyArray<Slide> = [
	{
		title: "Hard drop",
		notes: [
			{ text: "Nothing covers this spot, so a hard drop lands and locks the piece in one press.", aims: [OPEN_T] },
		],
		board: [{ rows: OPEN_BOARD }],
		marks: [OPEN_T],
	},
	{
		title: "Overhang",
		notes: [
			{ text: "An overhang covers this spot.", aims: [OVERHANG] },
			{ text: "A hard drop stops on top of it.", aims: [ON_TOP] },
		],
		board: [{ rows: COVERED_BOARD }],
		marks: [COVERED_T],
		overlays: [ghost(ON_TOP, "pink", null)],
	},
	{
		title: "Slide",
		notes: [
			{ text: "Soft drop beside the spot: the piece lands without locking.", aims: [BESIDE_T] },
			{ text: "Then slide it under. Players also call this a tuck.", aims: [COVERED_T] },
		],
		board: [{ rows: COVERED_BOARD }],
		marks: [COVERED_T],
		overlays: [ghost(BESIDE_T, "lime", "1"), ghost(COVERED_T, "lime", "2")],
	},
];
