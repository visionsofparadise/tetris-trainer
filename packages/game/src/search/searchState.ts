import type { Move } from "./moves";
import type { Piece } from "../pieces";
import type { SimBoard } from "../sim/simBoard";

export interface SearchState {
	readonly board: SimBoard;
	readonly current: Piece;
	readonly hold: Piece | null;
	readonly holdEnabled: boolean;
	readonly holdLocked: boolean;
	readonly queue: ReadonlyArray<Piece>;
}

export type RouteStep =
	{ readonly kind: "place"; readonly move: Move } | { readonly kind: "hold"; readonly move: Move };

export interface SearchBudget {
	readonly nodes: number;
	readonly depth: number;
	readonly deadlineMs: number | null;
}

export type SearchResult =
	| {
			readonly kind: "reached";
			readonly locks: number;
			readonly firstSteps: ReadonlyArray<RouteStep>;
			readonly nodes: number;
	  }
	| { readonly kind: "beyond"; readonly nodes: number }
	| { readonly kind: "unknown"; readonly nodes: number };
