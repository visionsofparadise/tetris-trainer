import type { Piece, Placement, ScriptStep } from "@tetris-trainer/game";

interface Tuck {
	readonly under: ReadonlyArray<Piece>;
	readonly description: string;
	readonly keys: ReadonlyArray<ScriptStep>;
}

export interface Position {
	readonly placement: Placement;
	readonly after: ReadonlyArray<Piece>;
	readonly description: string;
	readonly keys?: ReadonlyArray<ScriptStep>;
	readonly tuck?: Tuck;
}

interface Slide {
	readonly title: string;
	readonly text: string;
	readonly board: ReadonlyArray<Placement>;
	readonly marks: ReadonlyArray<Placement>;
}

export interface Opener {
	readonly name: string;
	readonly positions: ReadonlyArray<Position>;
	readonly slides: ReadonlyArray<Slide>;
}
