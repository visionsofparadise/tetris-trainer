import type { BoardMark } from "../../models/BoardMark";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { SearchClient } from "../../search/SearchClient";
import type {
	Block,
	Game,
	Handling,
	Piece,
	PlaceEvent,
	Placement,
	ScriptStep,
	SearchState,
	SimBoard,
} from "@tetris-trainer/game";

export interface Player {
	readonly handling: Handling;
	readonly allow180: boolean;
}

interface DrillHint {
	readonly best: Placement | null;
}

export interface KeyComparison {
	readonly yours: ReadonlyArray<ScriptStep>;
	readonly minimal: ReadonlyArray<ScriptStep>;
}

export interface DrillMistake extends DrillHint {
	readonly kind: string;
	readonly title: string;
	readonly detail?: string;
	readonly keys?: KeyComparison;
	readonly overlays?: ReadonlyArray<BoardOverlay>;
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

export interface DrillLock {
	readonly event: PlaceEvent;
	readonly before: SearchState;
	readonly after: SearchState;
}

export interface JudgeContext {
	readonly player: Player;
	readonly search: SearchClient;
}

export interface DrillJudgement<S> {
	readonly verdict: DrillVerdict;
	readonly next: S;
}

export interface DrillWords {
	readonly next: string;
	readonly resume?: string;
	readonly why: string;
}

interface WatchTurn {
	readonly steps: ReadonlyArray<ScriptStep>;
	readonly line: string | null;
}

interface WatchRound {
	readonly game: Game;
	readonly locks: number;
	readonly marks: ReadonlyArray<BoardMark>;
	readonly overlays?: (board: SimBoard) => ReadonlyArray<BoardOverlay>;
	readonly narration: ReadonlyArray<string>;
	readonly play: (spawn: SearchState, signal: AbortSignal) => Promise<WatchTurn>;
}

export interface Drill<S, T extends DrillStage = DrillStage> {
	readonly stages: ReadonlyArray<T>;
	readonly words: DrillWords;
	readonly start: (stage: T, seed: number) => S;
	readonly deal: (state: S, player: Player, round: DrillRound) => DrillDeal<S>;
	readonly judge: (state: S, lock: DrillLock, context: JudgeContext) => DrillJudgement<S> | Promise<DrillJudgement<S>>;
	readonly isRoundOver: (state: S) => boolean;
	readonly isPassed: (state: S) => boolean;
	readonly progress: (state: S) => { readonly label: string; readonly value: string };
	readonly marks: (state: S) => ReadonlyArray<BoardMark>;
	readonly overlays: (state: S, board: SimBoard) => ReadonlyArray<BoardOverlay>;
	readonly describe: (state: S, player: Player) => string;
	readonly owns?: (state: S, mino: Piece) => boolean;
	readonly delegate?: (state: S, spawn: SearchState, context: JudgeContext) => Promise<ReadonlyArray<ScriptStep>>;
	readonly onContinue: "next-round" | "resume";
	readonly watch?: (player: Player, search: SearchClient, round: number) => WatchRound;
}
