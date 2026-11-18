import { Mino, type Block, type Placement } from "@tetris-trainer/game";
import type { Position, Opener } from "./opener/Opener";

const J_POSITION: Placement = { mino: Mino.J, orientation: "reverse", column: 0, row: 0 };
const I_POSITION: Placement = { mino: Mino.I, orientation: "spawn", column: 0, row: 2 };
const O_POSITION: Placement = { mino: Mino.O, orientation: "spawn", column: 5, row: 0 };
const L_POSITION: Placement = { mino: Mino.L, orientation: "left", column: 4, row: 2 };
const Z_POSITION: Placement = { mino: Mino.Z, orientation: "spawn", column: 6, row: 1 };
const S_POSITION: Placement = { mino: Mino.S, orientation: "right", column: 8, row: 1 };
const T_POSITION: Placement = { mino: Mino.T, orientation: "left", column: 3, row: 0 };
const FLOATING_MINO: Block = [8, 3];

const SETUP: ReadonlyArray<Placement> = [J_POSITION, I_POSITION, O_POSITION, L_POSITION, Z_POSITION, S_POSITION];

const POSITIONS: ReadonlyArray<Position> = [
	{ placement: J_POSITION, after: [], description: "Lay the J upside down in the left corner." },
	{ placement: I_POSITION, after: [Mino.J], description: "Lay the I flat on the J." },
	{ placement: O_POSITION, after: [], description: "Put the O on the floor right of the slot." },
	{ placement: L_POSITION, after: [Mino.O], description: "Stand the L on the O, its foot over the slot." },
	{ placement: Z_POSITION, after: [Mino.O], description: "Hang the Z off the O's right side." },
	{ placement: S_POSITION, after: [Mino.Z], description: "Stand the S upright on the Z's end." },
	{
		placement: T_POSITION,
		after: [Mino.J, Mino.I, Mino.O, Mino.L, Mino.Z, Mino.S],
		description: "Spin the T upright into the slot for a T-spin double.",
		keys: [
			{ tap: "moveLeft" },
			{ tap: "moveLeft" },
			{ hold: "softDrop", frames: 20 },
			{ tap: "moveRight" },
			{ tap: "rotateCCW" },
			{ tap: "hardDrop" },
		],
	},
];

export const NUMBER_ONE: Opener = {
	name: "Number One",
	positions: POSITIONS,
	optional: [],
	slides: [
		{
			title: "Number One",
			notes: [
				{
					text: "Number One is a first-bag opener. The J, I, O, L, Z and S build this platform, then the T spins in upright for a T-spin double.",
					aims: [T_POSITION],
				},
			],
			board: [],
			marks: [],
			isLive: true,
		},
		{
			title: "The slot",
			notes: [
				{
					text: "The slot stands upright, as in STSD. Spin the T in: move it two left, soft drop onto the I, move it one right under the L, then turn it counterclockwise.",
					aims: [T_POSITION],
				},
				{ text: "The L hangs over the slot, so the T can't drop straight in.", aims: [L_POSITION] },
				{
					text: "The double leaves one S mino floating in row 2. Filling under it is a later lesson.",
					aims: [[FLOATING_MINO]],
				},
			],
			board: SETUP,
			marks: [T_POSITION],
		},
		{
			title: "Dependencies",
			notes: [
				{ text: "The I rests on the J, so the J must come before the I.", aims: [J_POSITION, I_POSITION] },
				{
					text: "The L and the Z rest on the O, so the O must come before both.",
					aims: [O_POSITION, L_POSITION, Z_POSITION],
				},
				{ text: "The S rests on the Z, so the Z must come before the S.", aims: [Z_POSITION, S_POSITION] },
				{ text: "The T needs all six pieces in first.", aims: [T_POSITION] },
			],
			board: SETUP,
			marks: [T_POSITION],
		},
		{
			title: "Hold",
			notes: [
				{
					text: "A piece that comes before the pieces it needs waits in hold. A swap brings it back once its support is in.",
					aims: ["hold"],
				},
				{ text: "An early S can wait in hold until the Z is in.", aims: [S_POSITION] },
				{ text: "The T always waits for the other six, so an early T takes the hold.", aims: [T_POSITION] },
			],
			board: [J_POSITION, I_POSITION, O_POSITION, L_POSITION, Z_POSITION, { hold: Mino.S }],
			marks: [S_POSITION, T_POSITION],
		},
		{
			title: "Is it possible?",
			notes: [
				{
					text: "Look for pieces that come before what they need: an I before the J, an L or Z before the O, an S before the Z, or a T before any of the six. Here the L and the T both come early. Hold can't keep both, so Number One can't be built.",
					aims: [],
				},
			],
			board: [],
			marks: [],
			queue: [Mino.L, Mino.T, Mino.O, Mino.J, Mino.I, Mino.Z, Mino.S],
		},
	],
};
