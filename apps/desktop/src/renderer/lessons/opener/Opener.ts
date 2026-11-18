import type { NoteAnchor } from "../../models/BoardNote";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { Block, BoardItem, Piece, Placement, ScriptStep } from "@tetris-trainer/game";

interface Tuck {
	readonly under: ReadonlyArray<Piece>;
	readonly description: string;
	readonly keys: ReadonlyArray<ScriptStep>;
}

export interface Position {
	readonly placement: Placement;
	readonly after: ReadonlyArray<Piece>;
	readonly before?: ReadonlyArray<Piece>;
	readonly description: string;
	readonly keys?: ReadonlyArray<ScriptStep>;
	readonly tuck?: Tuck;
}

type NoteAim = Placement | NoteAnchor | ReadonlyArray<Block>;

interface SlideNote {
	readonly text: string;
	readonly aims: ReadonlyArray<NoteAim>;
}

export interface Slide {
	readonly title: string;
	readonly notes: ReadonlyArray<SlideNote>;
	readonly board: ReadonlyArray<BoardItem>;
	readonly marks: ReadonlyArray<Placement>;
	readonly queue?: ReadonlyArray<Piece>;
	readonly overlays?: ReadonlyArray<BoardOverlay>;
	readonly isLive?: boolean;
}

interface Keep {
	readonly piece: Piece;
	readonly reason: string;
}

export interface Opener {
	readonly name: string;
	readonly positions: ReadonlyArray<Position>;
	readonly optional: ReadonlyArray<Piece>;
	readonly keep?: Keep;
	readonly slides: ReadonlyArray<Slide>;
}
