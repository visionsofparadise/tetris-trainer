import type { BoardMark } from "../../models/BoardMark";
import type { Block, Game, Handling, PlaceEvent, Placement, ScriptStep } from "@tetris-trainer/game";

export interface Player {
	readonly handling: Handling;
	readonly allow180: boolean;
}

interface DrillHint {
	readonly best: Placement | null;
}

export interface DrillMistake extends DrillHint {
	readonly kind: string;
	readonly title: string;
	readonly detail?: string;
	readonly placed: ReadonlyArray<Block> | null;
}

type DrillVerdict = { readonly ok: true } | ({ readonly ok: false } & DrillMistake);

export interface DrillStage {
	readonly id: string;
	readonly title: string;
	readonly goal: string;
	readonly onMistake: "pause" | "restart";
}

export type DrillRound = "same" | "next";

interface DrillDeal<S> {
	readonly game: Game;
	readonly state: S;
}

export interface WatchRound {
	readonly game: Game;
	readonly steps: ReadonlyArray<ScriptStep>;
	readonly locks: number;
	readonly marks: ReadonlyArray<BoardMark>;
	readonly narration: ReadonlyArray<string>;
}

export interface Drill<S, T extends DrillStage = DrillStage> {
	readonly stages: ReadonlyArray<T>;
	readonly start: (stage: T) => S;
	readonly deal: (state: S, player: Player, round: DrillRound) => DrillDeal<S>;
	readonly judge: (
		state: S,
		event: PlaceEvent,
		player: Player,
	) => { readonly verdict: DrillVerdict; readonly next: S };
	readonly isRoundOver: (state: S) => boolean;
	readonly isPassed: (state: S) => boolean;
	readonly progress: (state: S) => { readonly label: string; readonly value: string };
	readonly marks: (state: S) => ReadonlyArray<BoardMark>;
	readonly describe: (state: S, player: Player) => string;
	readonly watch?: (player: Player) => WatchRound;
}
