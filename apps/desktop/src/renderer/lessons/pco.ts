import { finesseSteps, Mino, type Block, type Placement } from "@tetris-trainer/game";
import type { Position, Opener } from "./opener/Opener";

const J_POSITION: Placement = { mino: Mino.J, orientation: "spawn", column: 0, row: 0 };
const O_POSITION: Placement = { mino: Mino.O, orientation: "spawn", column: 1, row: 1 };
const L_POSITION: Placement = { mino: Mino.L, orientation: "reverse", column: 0, row: 2 };
const Z_POSITION: Placement = { mino: Mino.Z, orientation: "spawn", column: 6, row: 0 };
const T_POSITION: Placement = { mino: Mino.T, orientation: "left", column: 8, row: 0 };
const S_POSITION: Placement = { mino: Mino.S, orientation: "spawn", column: 7, row: 2 };
const I_UPRIGHT: Placement = { mino: Mino.I, orientation: "right", column: 3, row: 0 };

const RECTANGLE = [J_POSITION, O_POSITION, L_POSITION];
const TRAPEZOID = [Z_POSITION, T_POSITION, S_POSITION];
const SHAPE = [...RECTANGLE, ...TRAPEZOID];

const GAP: ReadonlyArray<Block> = [
	...[3, 4, 5, 6].map((column): Block => [column, 0]),
	...[3, 4, 5].map((column): Block => [column, 1]),
	...[3, 4, 5, 6].map((column): Block => [column, 2]),
	...[3, 4, 5, 6, 7].map((column): Block => [column, 3]),
];

const POSITIONS: ReadonlyArray<Position> = [
	{ placement: J_POSITION, after: [], description: "Lay the J flat in the left corner." },
	{ placement: O_POSITION, after: [Mino.J], description: "Set the O on the J." },
	{ placement: L_POSITION, after: [Mino.J, Mino.O], description: "Lay the L upside down across the J and the O." },
	{
		placement: Z_POSITION,
		after: [],
		description: "Lay the Z flat on the floor at the right.",
		tuck: {
			under: [Mino.T],
			description: "Slide the Z under the T's nub.",
			keys: [
				...finesseSteps({ mino: Mino.Z, orientation: "spawn", column: Z_POSITION.column - 2 }),
				{ hold: "softDrop", frames: 20 },
				{ tap: "moveRight" },
				{ tap: "moveRight" },
				{ tap: "hardDrop" },
			],
		},
	},
	{ placement: T_POSITION, after: [], description: "Stand the T against the right wall." },
	{ placement: S_POSITION, after: [Mino.T], description: "Lay the S flat on the T." },
	{
		placement: I_UPRIGHT,
		after: [],
		description: "Stand the I upright beside the rectangle, because hold must keep another piece.",
	},
];

export const PCO: Opener = {
	name: "PCO",
	positions: POSITIONS,
	optional: [Mino.I],
	keep: { piece: Mino.I, reason: "the I stays in hold for the perfect clear" },
	slides: [
		{
			title: "PCO",
			notes: [
				{
					text: "PCO, the Perfect Clear Opener, is a first-bag shape. The L, J and O build a rectangle.",
					aims: RECTANGLE,
				},
				{ text: "The T, S and Z build a trapezoid.", aims: TRAPEZOID },
				{ text: "The I waits in hold from the moment it comes.", aims: ["hold"] },
			],
			board: [],
			marks: [],
			isLive: true,
		},
		{
			title: "Dependencies",
			notes: [
				{ text: "The O rests on the J, and the L rests on both.", aims: RECTANGLE },
				{ text: "The S rests on the T, so the T goes in first.", aims: [T_POSITION, S_POSITION] },
				{ text: "A Z that comes after the T slides in under the T's nub.", aims: [Z_POSITION] },
			],
			board: [...SHAPE, { hold: Mino.I }],
			marks: [],
		},
		{
			title: "Hold",
			notes: [
				{
					text: "A piece that comes before the pieces it needs waits in hold. Here the O came before the J.",
					aims: ["hold"],
				},
				{ text: "Hold keeps one piece, so the I stands upright here instead.", aims: [I_UPRIGHT] },
			],
			board: [...TRAPEZOID, { hold: Mino.O }],
			marks: [I_UPRIGHT],
		},
		{
			title: "Is it possible?",
			notes: [
				{
					text: "Look for pieces that come before what they need. Here the S and the O both come early. Hold can't keep both, so this shape can't be built.",
					aims: [],
				},
				{ text: "Other stackings of the same gap cover such orders. They're beyond this lesson.", aims: [] },
			],
			board: [],
			marks: [],
			queue: [Mino.S, Mino.O, Mino.Z, Mino.I, Mino.T, Mino.L, Mino.J],
		},
		{
			title: "Next: the perfect clear",
			notes: [
				{ text: "The next bag fills this gap for a perfect clear in four lines, a later lesson.", aims: [GAP] },
				{
					text: "With the I in hold, 84.64% of next bags make the perfect clear. With the I upright, 61.19% do. That's why the I waits in hold.",
					aims: ["hold"],
				},
			],
			board: [...SHAPE, { hold: Mino.I }],
			marks: [],
		},
	],
};
