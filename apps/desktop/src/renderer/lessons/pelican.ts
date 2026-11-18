import { Mino, type Placement } from "@tetris-trainer/game";
import type { Opener, Position } from "./opener/Opener";

const S_POSITION: Placement = { mino: Mino.S, orientation: "right", column: 0, row: 0 };
const Z_POSITION: Placement = { mino: Mino.Z, orientation: "spawn", column: 1, row: 1 };
const J_POSITION: Placement = { mino: Mino.J, orientation: "spawn", column: 5, row: 0 };
const O_POSITION: Placement = { mino: Mino.O, orientation: "spawn", column: 7, row: 1 };
const L_POSITION: Placement = { mino: Mino.L, orientation: "left", column: 5, row: 1 };
const I_POSITION: Placement = { mino: Mino.I, orientation: "right", column: 9, row: 0 };
const T_POSITION: Placement = { mino: Mino.T, orientation: "reverse", column: 3, row: 1 };

const POSITIONS: ReadonlyArray<Position> = [
	{ placement: S_POSITION, after: [], description: "Stand the S upright against the left wall." },
	{ placement: Z_POSITION, after: [Mino.S], description: "Lay the Z flat on the S." },
	{ placement: J_POSITION, after: [], description: "Lay the J flat on the floor, right of the slot." },
	{ placement: O_POSITION, after: [Mino.J], description: "Rest the O on the J's right end." },
	{ placement: L_POSITION, after: [Mino.J], description: "Stand the L on the J, its hook over the slot." },
	{ placement: I_POSITION, after: [], description: "Stand the I upright against the right wall." },
	{
		placement: T_POSITION,
		after: [Mino.S, Mino.Z, Mino.J, Mino.O, Mino.L, Mino.I],
		description: "Spin the T into the slot for a T-spin double.",
		keys: [{ tap: "rotateCCW" }, { hold: "softDrop", frames: 20 }, { tap: "rotateCCW" }, { tap: "hardDrop" }],
	},
];

const SETUP: ReadonlyArray<Placement> = [S_POSITION, Z_POSITION, J_POSITION, O_POSITION, L_POSITION, I_POSITION];

export const PELICAN: Opener = {
	name: "Pelican",
	positions: POSITIONS,
	optional: [],
	slides: [
		{
			title: "Pelican",
			notes: [
				{
					text: "Pelican is a first-bag opener. The S, Z, J, O, L and I build this shape, then the T spins into the slot for a T-spin double.",
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
					text: "Spin the T in: turn it counterclockwise, soft drop it down the open column, then turn it counterclockwise again.",
					aims: [T_POSITION],
				},
				{ text: "The L's hook hangs over the slot, so the T can't drop straight in.", aims: [L_POSITION] },
				{
					text: "The double clears the two middle rows. The bottom row and the L's hook stay for the second bag.",
					aims: [],
				},
			],
			board: SETUP,
			marks: [T_POSITION],
		},
		{
			title: "Dependencies",
			notes: [
				{ text: "The Z rests on the S, so the S must come before the Z.", aims: [S_POSITION, Z_POSITION] },
				{
					text: "The O and the L rest on the J, so the J must come before both.",
					aims: [J_POSITION, O_POSITION, L_POSITION],
				},
				{ text: "The T needs every other piece in first.", aims: [T_POSITION] },
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
				{ text: "An early L can wait in hold until the J is in.", aims: [L_POSITION] },
				{ text: "An early T can wait in hold until every other piece is in.", aims: [T_POSITION] },
			],
			board: [S_POSITION, Z_POSITION, I_POSITION, { hold: Mino.L }],
			marks: [J_POSITION, L_POSITION],
		},
		{
			title: "Is it possible?",
			notes: [
				{
					text: "With the S before the Z and the J before the L and O, only the T ever waits, so Pelican always builds.",
					aims: [],
				},
				{
					text: "Here the L and the O both come before the J. Hold can't keep both, so Pelican can't be built, even with the S first.",
					aims: [],
				},
			],
			board: [],
			marks: [],
			queue: [Mino.S, Mino.L, Mino.O, Mino.J, Mino.Z, Mino.I, Mino.T],
		},
	],
};
