import { finesseSteps, Mino, type Placement } from "@tetris-trainer/game";
import type { Position, Opener } from "./opener/Opener";

const J_POSITION: Placement = { mino: Mino.J, orientation: "left", column: 8, row: 0 };
const I_POSITION: Placement = { mino: Mino.I, orientation: "spawn", column: 3, row: 0 };
const S_POSITION: Placement = { mino: Mino.S, orientation: "spawn", column: 4, row: 1 };
const Z_POSITION: Placement = { mino: Mino.Z, orientation: "left", column: 2, row: 0 };
const O_POSITION: Placement = { mino: Mino.O, orientation: "spawn", column: 0, row: 0 };
const L_ON_O: Placement = { mino: Mino.L, orientation: "right", column: 0, row: 2 };
const L_ACROSS: Placement = { mino: Mino.L, orientation: "spawn", column: 0, row: 2 };
const L_ON_S: Placement = { mino: Mino.L, orientation: "reverse", column: 4, row: 2 };
const T_POSITION: Placement = { mino: Mino.T, orientation: "reverse", column: 6, row: 0 };

const POSITIONS: ReadonlyArray<Position> = [
	{ placement: J_POSITION, after: [], description: "Stand the J against the right wall." },
	{
		placement: I_POSITION,
		after: [],
		description: "Lay the I flat on the floor, left of the slot.",
		tuck: {
			under: [Mino.Z],
			description: "Slide the I under the Z.",
			keys: [
				...finesseSteps({ mino: Mino.I, orientation: "spawn", column: I_POSITION.column + 1 }),
				{ hold: "softDrop", frames: 20 },
				{ tap: "moveLeft" },
				{ tap: "hardDrop" },
			],
		},
	},
	{ placement: S_POSITION, after: [Mino.I], description: "Lay the S on the I, its top hanging over the slot." },
	{ placement: Z_POSITION, after: [], description: "Stand the Z upright at the I's left end." },
	{ placement: O_POSITION, after: [], description: "Put the O in the left corner." },
	{ placement: L_ON_O, after: [Mino.O], before: [Mino.T], description: "Stand the L upright on the O." },
	{
		placement: L_ACROSS,
		after: [Mino.Z, Mino.O],
		before: [Mino.T],
		description: "Lay the L flat across the Z and the O.",
	},
	{ placement: L_ON_S, after: [Mino.S], before: [Mino.T], description: "Lay the L upside down on the S." },
	{
		placement: T_POSITION,
		after: [Mino.J, Mino.I, Mino.S, Mino.Z, Mino.O],
		description: "Spin the T into the slot for a T-spin double.",
		keys: [
			{ tap: "rotateCCW" },
			{ tap: "moveRight" },
			{ tap: "moveRight" },
			{ tap: "moveRight" },
			{ tap: "moveRight" },
			{ hold: "softDrop", frames: 20 },
			{ tap: "rotateCCW" },
			{ tap: "hardDrop" },
		],
	},
];

const SHAPE = [J_POSITION, I_POSITION, S_POSITION, Z_POSITION, O_POSITION];

export const TKI_MIRRORED: Opener = {
	name: "TKI-3 mirrored",
	positions: POSITIONS,
	optional: [Mino.L],
	slides: [
		{
			title: "TKI-3 mirrored",
			notes: [
				{
					text: "This is TKI-3 built the other way round, with the slot on the right. The J, I, S, Z and O build this shape, then the T spins into the slot for a T-spin double.",
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
					text: "The slot is three wide and two deep. Spin the T in: turn it counterclockwise, move it right of the slot, soft drop, then turn it counterclockwise again.",
					aims: [T_POSITION],
				},
				{ text: "The S hangs over the slot, so the T can't drop straight in.", aims: [S_POSITION] },
			],
			board: SHAPE,
			marks: [T_POSITION],
		},
		{
			title: "Dependencies",
			notes: [
				{ text: "The S rests on the I, so the I must come before the S.", aims: [I_POSITION, S_POSITION] },
				{ text: "The T needs the J, I, S, Z and O in first, but not the L.", aims: [T_POSITION] },
			],
			board: SHAPE,
			marks: [T_POSITION],
		},
		{
			title: "L",
			notes: [
				{
					text: "The setup doesn't need the L. Placing it in one of these spots sets up continuations.",
					aims: [L_ON_O, L_ACROSS, L_ON_S],
				},
				{ text: "Or keep it in hold through the T-spin and place it anywhere after.", aims: ["hold"] },
				{ text: "If the L comes last, the setup is already done.", aims: [] },
			],
			board: SHAPE,
			marks: [L_ON_O, L_ACROSS, L_ON_S],
		},
		{
			title: "Hold",
			notes: [
				{
					text: "A piece that comes before the pieces it needs waits in hold. A swap brings it back once its support is in.",
					aims: ["hold"],
				},
				{ text: "An early S can wait in hold until the I is in.", aims: [S_POSITION] },
				{ text: "An early T can wait in hold until the J, I, S, Z and O are in.", aims: [T_POSITION] },
			],
			board: [J_POSITION, I_POSITION, Z_POSITION, O_POSITION, { hold: Mino.S }],
			marks: [S_POSITION, T_POSITION],
		},
		{
			title: "Is it possible?",
			notes: [
				{
					text: "Look for pieces that come before what they need: an S before the I, or a T before any of the J, I, S, Z and O. Here the T and the S both come early. Hold can't keep both, so this TKI-3 can't be built.",
					aims: [],
				},
			],
			board: [],
			marks: [],
			queue: [Mino.T, Mino.S, Mino.J, Mino.O, Mino.I, Mino.Z, Mino.L],
		},
	],
};
