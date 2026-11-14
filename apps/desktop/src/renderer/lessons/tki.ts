import { finesseSteps, Mino, type Placement } from "@tetris-trainer/game";
import type { Home, Opener } from "./opener/Opener";

const L_HOME: Placement = { mino: Mino.L, orientation: "right", column: 0, row: 0 };
const I_HOME: Placement = { mino: Mino.I, orientation: "spawn", column: 3, row: 0 };
const Z_HOME: Placement = { mino: Mino.Z, orientation: "spawn", column: 3, row: 1 };
const S_HOME: Placement = { mino: Mino.S, orientation: "right", column: 6, row: 0 };
const O_HOME: Placement = { mino: Mino.O, orientation: "spawn", column: 8, row: 0 };
const J_ON_O: Placement = { mino: Mino.J, orientation: "left", column: 8, row: 2 };
const J_ACROSS: Placement = { mino: Mino.J, orientation: "spawn", column: 7, row: 2 };
const J_ON_Z: Placement = { mino: Mino.J, orientation: "reverse", column: 3, row: 2 };
const T_HOME: Placement = { mino: Mino.T, orientation: "reverse", column: 1, row: 0 };

const HOMES: ReadonlyArray<Home> = [
	{ placement: L_HOME, after: [], description: "Stand the L against the left wall." },
	{ placement: I_HOME, after: [], description: "Lay the I flat on the floor, right of the slot." },
	{ placement: Z_HOME, after: [Mino.I], description: "Lay the Z on the I, its top hanging over the slot." },
	{ placement: S_HOME, after: [Mino.I], description: "Stand the S upright on the I's right end." },
	{ placement: O_HOME, after: [], description: "Put the O in the right corner." },
	{ placement: J_ON_O, after: [Mino.O], description: "Stand the J upright on the O." },
	{ placement: J_ACROSS, after: [Mino.S, Mino.O], description: "Lay the J flat across the S and the O." },
	{ placement: J_ON_Z, after: [Mino.Z], description: "Lay the J upside down on the Z." },
	{
		placement: T_HOME,
		after: [Mino.L, Mino.I, Mino.Z, Mino.S, Mino.O, Mino.J],
		description: "Spin the T into the slot for a T-spin double.",
		keys: [
			...finesseSteps({ mino: Mino.T, orientation: "right", column: 1 }),
			{ hold: "softDrop", frames: 20 },
			{ tap: "rotateCW" },
			{ tap: "hardDrop" },
		],
	},
];

export const TKI: Opener = {
	name: "TKI",
	homes: HOMES,
	slides: [
		{
			title: "TKI",
			text: "TKI is an opener: the first bag builds this shape, and the last piece, the T, spins into the slot for a T-spin double. It's named after TKI, the player who invented it.",
			board: [L_HOME, I_HOME, Z_HOME, S_HOME, O_HOME, J_ON_O],
			marks: [T_HOME],
		},
		{
			title: "The slot",
			text: "The slot is three wide and two deep. The L and the I give the T its two bottom corners and the Z's overhang gives the third, so the T can only get in by spinning.",
			board: [L_HOME, I_HOME, Z_HOME, S_HOME, O_HOME],
			marks: [T_HOME],
		},
		{
			title: "L",
			text: "The L stands against the left wall. It rests on the floor, so it can go in at any time.",
			board: [],
			marks: [L_HOME],
		},
		{
			title: "I",
			text: "The I lies flat on the floor right of the slot. The Z and the S rest on it, so it needs to come early.",
			board: [L_HOME],
			marks: [I_HOME],
		},
		{
			title: "Z",
			text: "The Z lies on the I with its top hanging over the slot. That overhang is what makes the T spin. It needs the I first.",
			board: [L_HOME, I_HOME],
			marks: [Z_HOME],
		},
		{
			title: "S",
			text: "The S stands upright on the I's right end. It covers the column the I lies in, so the I must already be there.",
			board: [L_HOME, I_HOME, Z_HOME],
			marks: [S_HOME],
		},
		{
			title: "O",
			text: "The O fills the right corner. It rests on the floor, so it can go in at any time.",
			board: [L_HOME, I_HOME, Z_HOME, S_HOME],
			marks: [O_HOME],
		},
		{
			title: "J",
			text: "The J sits on top, clear of the two lines the T clears. It has three homes: upright on the O, flat across the S and the O, or upside down on the Z. Each needs the pieces under it first.",
			board: [L_HOME, I_HOME, Z_HOME, S_HOME, O_HOME],
			marks: [J_ON_O, J_ACROSS, J_ON_Z],
		},
		{
			title: "T goes last",
			text: "The T goes in after the other six. Turn it clockwise, move it to the column left of the slot, soft drop to the bottom, then turn it clockwise again. The two full lines clear: a T-spin double.",
			board: [L_HOME, I_HOME, Z_HOME, S_HOME, O_HOME, J_ON_O],
			marks: [T_HOME],
		},
		{
			title: "Hold",
			text: "A piece that arrives before the pieces it needs goes into hold. Hold keeps one piece waiting, and a swap brings it back out once its support is in. An early T waits in hold to the end, then swaps out with the first piece of the next bag.",
			board: [L_HOME, I_HOME],
			marks: [Z_HOME, S_HOME],
		},
		{
			title: "Is it possible?",
			text: "At the start you can see the whole first bag: the current piece, the five in the queue, and the one piece missing from them. Look for pieces that come before what they need, including a T that isn't last. If two of them would have to wait at the same time, hold can't keep both, and TKI can't be built.",
			board: [],
			marks: [L_HOME, I_HOME, Z_HOME, S_HOME, O_HOME, J_ON_O],
		},
	],
};
