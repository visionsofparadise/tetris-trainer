import type { Tone } from "./Tone";
import type { Block } from "@tetris-trainer/game";

export type NoteAnchor = "hold" | "next";

export interface NoteTarget {
	readonly at: ReadonlyArray<Block> | NoteAnchor;
	readonly tone: Tone;
}

export interface KeyRow {
	readonly label: string;
	readonly tone: Tone;
	readonly keys: ReadonlyArray<string>;
}

export interface BoardNote {
	readonly title?: string;
	readonly text?: string;
	readonly keys?: ReadonlyArray<KeyRow>;
	readonly tone: Tone;
	readonly targets: ReadonlyArray<NoteTarget>;
}
