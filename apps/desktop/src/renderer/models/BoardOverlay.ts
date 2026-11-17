import type { Tone } from "./Tone";
import type { Block } from "@tetris-trainer/game";

export type BoardOverlay =
	| { readonly kind: "tint"; readonly cells: ReadonlyArray<Block>; readonly tone: Tone }
	| { readonly kind: "rowLine"; readonly row: number; readonly tone: Tone; readonly label: string }
	| {
			readonly kind: "ghost";
			readonly cells: ReadonlyArray<Block>;
			readonly tone: Tone;
			readonly label: string | null;
	  };
