import {
	minimalPresses,
	Mino,
	type Orientation,
	type Piece,
	type PieceTarget,
	type ScriptStep,
} from "@tetris-trainer/game";
import { FINESSE_TARGETS } from "./targets";
import type { DeckSlide } from "../../Components/Lesson/SlideDeck";

interface SlideDemo {
	readonly target: PieceTarget;
	readonly route: "minimal" | ReadonlyArray<ScriptStep>;
}

export interface FinesseSlide extends DeckSlide {
	readonly title: string;
	readonly notes: ReadonlyArray<string>;
	readonly demos: ReadonlyArray<SlideDemo>;
}

const PRESS_COUNTS: ReadonlyArray<number> = [0, 1, 2, 3];

const at = (mino: Piece, orientation: Orientation, column: number): PieceTarget => ({ mino, orientation, column });

const minimal = (target: PieceTarget): SlideDemo => ({ target, route: "minimal" });

const firstTAt = (presses: number): ReadonlyArray<SlideDemo> =>
	FINESSE_TARGETS.filter((target) => target.mino === Mino.T && minimalPresses(target, { allow180: true }) === presses)
		.slice(0, 1)
		.map(minimal);

export const FINESSE_SLIDES: ReadonlyArray<FinesseSlide> = [
	{
		title: "Two steps",
		isLive: true,
		notes: [
			"Finesse is placing each piece with the fewest key presses.",
			"On an empty board every spot takes two steps at most, a turn and a move, then the drop.",
			"With a 180 key, no spot needs more than three presses.",
		],
		demos: PRESS_COUNTS.flatMap(firstTAt),
	},
	{
		title: "DAS to the wall",
		isLive: true,
		notes: [
			"Hold a move key past the DAS delay and the piece slides until the wall stops it.",
			"One DAS reaches the wall from anywhere.",
		],
		demos: [minimal(at(Mino.T, "spawn", 0)), minimal(at(Mino.T, "spawn", 7))],
	},
	{
		title: "Never three taps",
		isLive: true,
		notes: ["One column off the wall is a DAS and a tap back.", "Three taps would cost one press more."],
		demos: [minimal(at(Mino.T, "spawn", 6))],
	},
	{
		title: "The gap rule",
		isLive: true,
		notes: [
			"Turn first, then DAS, and the piece sits flush against the wall.",
			"DAS first, then turn, and it stands one column off, leaving a gap.",
			"A turn at the wall pivots the piece off it.",
		],
		demos: [minimal(at(Mino.J, "right", 0)), minimal(at(Mino.J, "right", 1))],
	},
	{
		title: "Rotate toward travel",
		isLive: true,
		notes: [
			"After a DAS, turn the way the piece should go.",
			"After a DAS left, CW steps the S off the wall and CCW keeps it there.",
		],
		demos: [
			{ target: at(Mino.S, "right", 0), route: [{ das: "moveLeft" }, { tap: "rotateCCW" }] },
			{ target: at(Mino.S, "right", 1), route: [{ das: "moveLeft" }, { tap: "rotateCW" }] },
		],
	},
	{
		title: "Two verticals",
		isLive: true,
		notes: ["S, Z and I stand up two ways.", "From spawn, CW stands the piece one column right of CCW."],
		demos: [minimal(at(Mino.S, "right", 3)), minimal(at(Mino.S, "right", 4))],
	},
	{
		title: "One table",
		isLive: true,
		notes: ["J and L take the T's keys for every spot.", "Flat S and Z take the flat T's keys."],
		demos: [minimal(at(Mino.T, "left", 6)), minimal(at(Mino.J, "left", 6)), minimal(at(Mino.L, "left", 6))],
	},
	{
		title: "South",
		isLive: true,
		notes: ["Upside down is a 180, then the flat keys.", "Two turns the same way also pass, as they do in TETR.IO."],
		demos: [minimal(at(Mino.T, "reverse", 3)), minimal(at(Mino.T, "reverse", 0))],
	},
	{
		title: "Ties",
		isLive: true,
		notes: ["Some spots have two shortest routes.", "Either passes: the judge counts presses, not one fixed order."],
		demos: [
			{ target: at(Mino.T, "spawn", 1), route: [{ tap: "moveLeft" }, { tap: "moveLeft" }] },
			{ target: at(Mino.T, "spawn", 1), route: [{ das: "moveLeft" }, { tap: "moveRight" }] },
		],
	},
];
