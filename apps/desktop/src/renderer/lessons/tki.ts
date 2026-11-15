import { finesseSteps, Mino, type Placement } from "@tetris-trainer/game";
import type { Position, Opener } from "./opener/Opener";

const L_POSITION: Placement = { mino: Mino.L, orientation: "right", column: 0, row: 0 };
const I_POSITION: Placement = { mino: Mino.I, orientation: "spawn", column: 3, row: 0 };
const Z_POSITION: Placement = { mino: Mino.Z, orientation: "spawn", column: 3, row: 1 };
const S_POSITION: Placement = { mino: Mino.S, orientation: "right", column: 6, row: 0 };
const O_POSITION: Placement = { mino: Mino.O, orientation: "spawn", column: 8, row: 0 };
const J_ON_O: Placement = { mino: Mino.J, orientation: "left", column: 8, row: 2 };
const J_ACROSS: Placement = { mino: Mino.J, orientation: "spawn", column: 7, row: 2 };
const J_ON_Z: Placement = { mino: Mino.J, orientation: "reverse", column: 3, row: 2 };
const T_POSITION: Placement = { mino: Mino.T, orientation: "reverse", column: 1, row: 0 };

const POSITIONS: ReadonlyArray<Position> = [
	{ placement: L_POSITION, after: [], description: "Stand the L against the left wall." },
	{
		placement: I_POSITION,
		after: [],
		description: "Lay the I flat on the floor, right of the slot.",
		tuck: {
			under: [Mino.S],
			description: "Slide the I under the S.",
			keys: [
				...finesseSteps({ mino: Mino.I, orientation: "spawn", column: I_POSITION.column - 1 }),
				{ hold: "softDrop", frames: 20 },
				{ tap: "moveRight" },
				{ tap: "hardDrop" },
			],
		},
	},
	{ placement: Z_POSITION, after: [Mino.I], description: "Lay the Z on the I, its top hanging over the slot." },
	{ placement: S_POSITION, after: [], description: "Stand the S upright at the I's right end." },
	{ placement: O_POSITION, after: [], description: "Put the O in the right corner." },
	{ placement: J_ON_O, after: [Mino.O], before: [Mino.T], description: "Stand the J upright on the O." },
	{
		placement: J_ACROSS,
		after: [Mino.S, Mino.O],
		before: [Mino.T],
		description: "Lay the J flat across the S and the O.",
	},
	{ placement: J_ON_Z, after: [Mino.Z], before: [Mino.T], description: "Lay the J upside down on the Z." },
	{
		placement: T_POSITION,
		after: [Mino.L, Mino.I, Mino.Z, Mino.S, Mino.O],
		description: "Spin the T into the slot for a T-spin double.",
		keys: [
			{ tap: "rotateCW" },
			{ tap: "moveLeft" },
			{ tap: "moveLeft" },
			{ tap: "moveLeft" },
			{ hold: "softDrop", frames: 20 },
			{ tap: "rotateCW" },
			{ tap: "hardDrop" },
		],
	},
];

export const TKI: Opener = {
	name: "TKI-3",
	positions: POSITIONS,
	optional: [Mino.J],
	slides: [
		{
			title: "TKI-3",
			notes: [
				{
					text: "TKI-3 is a first-bag opener. The L, I, Z, S and O build this shape, then the T spins into the slot for a T-spin double.",
					aims: [T_POSITION],
				},
			],
			board: [],
			marks: [],
			isDemo: true,
		},
		{
			title: "The slot",
			notes: [
				{
					text: "The slot is three wide and two deep. Spin the T in: turn it clockwise, move it left of the slot, soft drop, then turn it clockwise again.",
					aims: [T_POSITION],
				},
				{ text: "The Z hangs over the slot, so the T can't drop straight in.", aims: [Z_POSITION] },
			],
			board: [L_POSITION, I_POSITION, Z_POSITION, S_POSITION, O_POSITION],
			marks: [T_POSITION],
		},
		{
			title: "Dependencies",
			notes: [
				{ text: "The Z rests on the I, so the I must come before the Z.", aims: [I_POSITION, Z_POSITION] },
				{
					text: "The T needs the L, I, Z, S and O in first, but not the J.",
					aims: [T_POSITION],
				},
			],
			board: [L_POSITION, I_POSITION, Z_POSITION, S_POSITION, O_POSITION],
			marks: [T_POSITION],
		},
		{
			title: "J",
			notes: [
				{
					text: "The setup doesn't need the J. Placing it in one of these spots sets up continuations.",
					aims: [J_ON_O, J_ACROSS, J_ON_Z],
				},
				{ text: "Or keep it in hold through the T-spin and place it anywhere after.", aims: ["hold"] },
				{ text: "If the J comes last, the setup is already done.", aims: [] },
			],
			board: [L_POSITION, I_POSITION, Z_POSITION, S_POSITION, O_POSITION],
			marks: [J_ON_O, J_ACROSS, J_ON_Z],
		},
		{
			title: "Hold",
			notes: [
				{
					text: "A piece that comes before the pieces it needs waits in hold. A swap brings it back once its support is in.",
					aims: ["hold"],
				},
				{ text: "An early Z can wait in hold until the I is in.", aims: [Z_POSITION] },
				{ text: "An early T can wait in hold until the L, I, Z, S and O are in.", aims: [T_POSITION] },
			],
			board: [L_POSITION, I_POSITION, S_POSITION, O_POSITION, { hold: Mino.Z }],
			marks: [Z_POSITION, T_POSITION],
		},
		{
			title: "Is it possible?",
			notes: [
				{
					text: "Look for pieces that come before what they need: a Z before the I, or a T before any of the L, I, Z, S and O. Here the T and the Z both come early. Hold can't keep both, so TKI-3 can't be built.",
					aims: [],
				},
			],
			board: [],
			marks: [],
			queue: [Mino.T, Mino.Z, Mino.L, Mino.O, Mino.I, Mino.S, Mino.J],
		},
	],
};
