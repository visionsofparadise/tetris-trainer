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
	{ placement: J_ON_O, after: [Mino.O], description: "Stand the J upright on the O." },
	{ placement: J_ACROSS, after: [Mino.S, Mino.O], description: "Lay the J flat across the S and the O." },
	{ placement: J_ON_Z, after: [Mino.Z], description: "Lay the J upside down on the Z." },
	{
		placement: T_POSITION,
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
	positions: POSITIONS,
	slides: [
		{
			title: "TKI",
			text: "TKI is an opener: the first bag builds this shape, and the last piece, the T, spins into the slot for a T-spin double. It's named after TKI, the player who invented it.",
			board: [L_POSITION, I_POSITION, Z_POSITION, S_POSITION, O_POSITION, J_ON_O],
			marks: [T_POSITION],
		},
		{
			title: "The slot",
			text: "The slot is three wide and two deep. The L and the I give the T its two bottom corners and the Z's overhang gives the third, so the T can only get in by spinning.",
			board: [L_POSITION, I_POSITION, Z_POSITION, S_POSITION, O_POSITION],
			marks: [T_POSITION],
		},
		{
			title: "L",
			text: "The L stands against the left wall. It rests on the floor, so it can go in at any time.",
			board: [],
			marks: [L_POSITION],
		},
		{
			title: "I",
			text: "The I lies flat on the floor right of the slot. The Z rests on it, so the I must come before the Z.",
			board: [L_POSITION],
			marks: [I_POSITION],
		},
		{
			title: "Z",
			text: "The Z lies on the I with its top hanging over the slot. That overhang is what makes the T spin. It needs the I first.",
			board: [L_POSITION, I_POSITION],
			marks: [Z_POSITION],
		},
		{
			title: "S",
			text: "The S stands upright at the I's right end. It rests on the floor, so it can go in at any time.",
			board: [L_POSITION, I_POSITION, Z_POSITION],
			marks: [S_POSITION],
		},
		{
			title: "O",
			text: "The O fills the right corner. It rests on the floor, so it can go in at any time.",
			board: [L_POSITION, I_POSITION, Z_POSITION, S_POSITION],
			marks: [O_POSITION],
		},
		{
			title: "J",
			text: "The J sits on top, clear of the two lines the T clears. It has three positions: upright on the O, flat across the S and the O, or upside down on the Z. Each needs the pieces under it first.",
			board: [L_POSITION, I_POSITION, Z_POSITION, S_POSITION, O_POSITION],
			marks: [J_ON_O, J_ACROSS, J_ON_Z],
		},
		{
			title: "T goes last",
			text: "The T goes in after the other six. Turn it clockwise, move it to the column left of the slot, soft drop to the bottom, then turn it clockwise again. The two full lines clear: a T-spin double.",
			board: [L_POSITION, I_POSITION, Z_POSITION, S_POSITION, O_POSITION, J_ON_O],
			marks: [T_POSITION],
		},
		{
			title: "Hold",
			text: "A piece that arrives before the pieces it needs goes into hold. Hold keeps one piece waiting, and a swap brings it back out once its support is in. An early T waits in hold to the end, then swaps out with the first piece of the next bag.",
			board: [L_POSITION, I_POSITION],
			marks: [Z_POSITION, S_POSITION],
		},
		{
			title: "Is it possible?",
			text: "At the start you can see the whole first bag: the current piece, the five in the queue, and the one piece missing from them. Look for pieces that come before what they need, including a T that isn't last. If two of them would have to wait at the same time, hold can't keep both, and TKI can't be built.",
			board: [],
			marks: [L_POSITION, I_POSITION, Z_POSITION, S_POSITION, O_POSITION, J_ON_O],
		},
	],
};
