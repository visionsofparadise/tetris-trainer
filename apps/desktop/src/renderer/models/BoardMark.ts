import type { Block } from "@tetris-trainer/game";

type MarkTone = "target" | "mistake";

export interface BoardMark {
	readonly cells: ReadonlyArray<Block>;
	readonly tone: MarkTone;
}
