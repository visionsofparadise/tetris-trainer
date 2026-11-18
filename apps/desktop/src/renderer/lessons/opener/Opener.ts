import type { NoteAnchor } from "../../models/BoardNote";
import type { BoardItem, Piece, Placement, ScriptStep } from "@tetris-trainer/game";

export const NEXT_BAG = "next-bag";

type Hand = Piece | typeof NEXT_BAG;

export interface PlanState {
	readonly order: ReadonlyArray<Piece>;
	readonly drawn: number;
	readonly current: Hand;
	readonly hold: Hand | null;
	readonly holdLocked: boolean;
	readonly placed: ReadonlyArray<Piece>;
}

export type Decision =
	| { readonly kind: "place"; readonly placement: Placement; readonly keys?: ReadonlyArray<ScriptStep> }
	| { readonly kind: "hold" };

export type Move = { readonly kind: "place"; readonly placement: Placement } | { readonly kind: "hold" };

export type MistakeKind = "placement" | "order" | "dead-end" | "hold" | "next-bag" | "impossible";

export interface Mistake {
	readonly kind: MistakeKind;
	readonly best: Decision | null;
}

export type Category = "no-hold" | "hold" | "impossible";

type Verdict = { readonly result: "complete" } | { readonly result: "ok" } | ({ readonly result: "mistake" } & Mistake);

type NoteAim = Placement | NoteAnchor;

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
	readonly isLive?: boolean;
}

export interface Opener {
	readonly name: string;
	readonly pieceCount: () => number;
	readonly placedCount: (state: PlanState) => number;
	readonly deal: (category: Category) => Array<Piece>;
	readonly plan: (state: PlanState) => Array<Decision> | null;
	readonly judge: (state: PlanState, move: Move) => Verdict;
}
