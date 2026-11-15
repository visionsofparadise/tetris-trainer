import type { Tone } from "./Tone";
import type { Block } from "@tetris-trainer/game";

export type NoteAnchor = "hold" | "next";

export interface NoteTarget {
	readonly at: ReadonlyArray<Block> | NoteAnchor;
	readonly tone: Tone;
}

export interface BoardNote {
	readonly title?: string;
	readonly text?: string;
	readonly tone: Tone;
	readonly targets: ReadonlyArray<NoteTarget>;
}
