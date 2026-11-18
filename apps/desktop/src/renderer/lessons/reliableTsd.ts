import { finesseSteps, Mino, type Placement, type ScriptStep } from "@tetris-trainer/game";
import type { Position, Opener } from "./opener/Opener";

const O_POSITION: Placement = { mino: Mino.O, orientation: "spawn", column: 0, row: 0 };
const L_POSITION: Placement = { mino: Mino.L, orientation: "reverse", column: 2, row: 0 };
const I_POSITION: Placement = { mino: Mino.I, orientation: "spawn", column: 3, row: 0 };
const S_POSITION: Placement = { mino: Mino.S, orientation: "right", column: 4, row: 1 };
const J_POSITION: Placement = { mino: Mino.J, orientation: "left", column: 8, row: 0 };
const Z_POSITION: Placement = { mino: Mino.Z, orientation: "right", column: 8, row: 2 };
const T_POSITION: Placement = { mino: Mino.T, orientation: "reverse", column: 6, row: 0 };

const SOFT_DROP: ScriptStep = { hold: "softDrop", frames: 20 };

const BUILD = [O_POSITION, L_POSITION, I_POSITION, S_POSITION, J_POSITION, Z_POSITION];

const POSITIONS: ReadonlyArray<Position> = [
	{ placement: O_POSITION, after: [], description: "Put the O in the left corner." },
	{ placement: L_POSITION, after: [], before: [Mino.S], description: "Lay the L flat, its foot down beside the O." },
	{
		placement: L_POSITION,
		after: [Mino.S],
		before: [Mino.O],
		description: "Slide the L in from the left wall, under the S.",
		keys: [
			...finesseSteps({ mino: Mino.L, orientation: "reverse", column: 0 }),
			SOFT_DROP,
			{ tap: "moveRight" },
			{ tap: "moveRight" },
			{ tap: "hardDrop" },
		],
	},
	{
		placement: L_POSITION,
		after: [Mino.S, Mino.O],
		description: "Stand the L on the I, then spin it clockwise under the S.",
		keys: [
			{ tap: "rotateCW" },
			{ tap: "moveLeft" },
			{ tap: "moveLeft" },
			SOFT_DROP,
			{ tap: "rotateCW" },
			{ tap: "hardDrop" },
		],
	},
	{ placement: I_POSITION, after: [], before: [Mino.L], description: "Lay the I flat on the floor, right of the L." },
	{
		placement: I_POSITION,
		after: [Mino.L],
		before: [Mino.J],
		description: "Slide the I in from the right wall, under the L.",
		keys: [
			...finesseSteps({ mino: Mino.I, orientation: "spawn", column: 6 }),
			SOFT_DROP,
			{ tap: "moveLeft" },
			{ tap: "moveLeft" },
			{ tap: "moveLeft" },
			{ tap: "hardDrop" },
		],
	},
	{
		placement: I_POSITION,
		after: [Mino.L, Mino.J],
		description: "Drop the I upright into the slot, then spin it counterclockwise under the L.",
		keys: [
			{ tap: "rotateCCW" },
			{ tap: "moveRight" },
			{ tap: "moveRight" },
			{ tap: "moveRight" },
			SOFT_DROP,
			{ tap: "rotateCCW" },
			{ tap: "moveLeft" },
			{ tap: "hardDrop" },
		],
	},
	{ placement: S_POSITION, after: [Mino.I], description: "Stand the S upright on the I." },
	{ placement: S_POSITION, after: [Mino.L], description: "Stand the S upright on the L." },
	{ placement: J_POSITION, after: [], description: "Stand the J against the right wall." },
	{ placement: Z_POSITION, after: [Mino.J], description: "Stand the Z on the J, its bottom hanging over the slot." },
	{
		placement: T_POSITION,
		after: [Mino.O, Mino.L, Mino.I, Mino.S, Mino.J, Mino.Z],
		description: "Spin the T into the slot for a T-spin double.",
		keys: [
			{ tap: "rotateCW" },
			{ tap: "moveRight" },
			{ tap: "moveRight" },
			SOFT_DROP,
			{ tap: "rotateCW" },
			{ tap: "hardDrop" },
		],
	},
];

export const RELIABLE_TSD: Opener = {
	name: "Reliable TSD",
	positions: POSITIONS,
	optional: [],
	slides: [
		{
			title: "Reliable TSD",
			notes: [
				{
					text: "Reliable TSD is a first-bag opener by Yuu. The O, L, I, S, J and Z build this shape, then the T spins into the slot for a T-spin double.",
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
					text: "The slot is three wide and two deep. Spin the T in: turn it clockwise, move it right of the slot, soft drop, then turn it clockwise again.",
					aims: [T_POSITION],
				},
				{ text: "The Z hangs over the slot, so the T can't drop straight in.", aims: [Z_POSITION] },
			],
			board: BUILD,
			marks: [T_POSITION],
		},
		{
			title: "Dependencies",
			notes: [
				{ text: "The Z rests on the J, so the J must come before the Z.", aims: [J_POSITION, Z_POSITION] },
				{ text: "The S rests on the I or the L, so one of them must come before the S.", aims: [S_POSITION] },
				{ text: "The T needs all six other pieces in first.", aims: [T_POSITION] },
			],
			board: BUILD,
			marks: [T_POSITION],
		},
		{
			title: "Late I",
			notes: [
				{
					text: "The L covers the I's spot. Before the J, slide the I in along the floor from the right wall.",
					aims: [I_POSITION],
				},
				{
					text: "Once the J is in, drop the I upright into the slot and spin it counterclockwise under the L.",
					aims: [J_POSITION],
				},
			],
			board: [O_POSITION, L_POSITION, S_POSITION, J_POSITION, Z_POSITION],
			marks: [I_POSITION],
		},
		{
			title: "Late L",
			notes: [
				{
					text: "The S covers the L's spot. Before the O, slide the L in along the floor from the left wall.",
					aims: [L_POSITION],
				},
				{
					text: "Once the O is in, stand the L on the I and spin it clockwise under the S.",
					aims: [O_POSITION],
				},
			],
			board: [O_POSITION, I_POSITION, S_POSITION, J_POSITION, Z_POSITION],
			marks: [L_POSITION],
		},
		{
			title: "Hold",
			notes: [
				{
					text: "A piece that comes before the pieces it needs waits in hold. A swap brings it back once its support is in.",
					aims: ["hold"],
				},
				{ text: "An early Z waits in hold until the J is in.", aims: [Z_POSITION] },
				{ text: "An early S waits in hold until the I or the L is in.", aims: [S_POSITION] },
				{ text: "An early T waits in hold until the other six are in.", aims: [T_POSITION] },
			],
			board: [O_POSITION, L_POSITION, I_POSITION, S_POSITION, { hold: Mino.Z }],
			marks: [J_POSITION, Z_POSITION, T_POSITION],
		},
		{
			title: "Is it possible?",
			notes: [
				{
					text: "Look for pieces that come before what they need: a Z before the J, an S before both the I and the L, or a T before any other piece. Here the T and the Z both come early. Hold can't keep both, so Reliable TSD can't be built.",
					aims: [],
				},
			],
			board: [],
			marks: [],
			queue: [Mino.T, Mino.Z, Mino.O, Mino.J, Mino.L, Mino.I, Mino.S],
		},
	],
};
