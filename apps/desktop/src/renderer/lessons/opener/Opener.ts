import type { Piece, Placement, ScriptStep } from "@tetris-trainer/game";

export interface Home {
	readonly placement: Placement;
	readonly after: ReadonlyArray<Piece>;
	readonly description: string;
	readonly keys?: ReadonlyArray<ScriptStep>;
}

interface Slide {
	readonly title: string;
	readonly text: string;
	readonly board: ReadonlyArray<Placement>;
	readonly marks: ReadonlyArray<Placement>;
}

export interface Opener {
	readonly name: string;
	readonly homes: ReadonlyArray<Home>;
	readonly slides: ReadonlyArray<Slide>;
}
