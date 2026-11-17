import type {
	FitResult,
	Mover,
	MoveRules,
	Piece,
	QuadGoal,
	SearchBudget,
	SearchResult,
	SearchState,
	SimBoard,
} from "@tetris-trainer/game";

export interface SearchClient {
	readonly quadReady: (
		state: SearchState,
		goal: QuadGoal,
		rules: MoveRules,
		mover: Mover,
		budget: SearchBudget,
	) => Promise<SearchResult>;
	readonly fitAfter: (
		board: SimBoard,
		mino: Piece,
		pieces: ReadonlyArray<Piece>,
		rules: MoveRules,
		mover: Mover,
	) => Promise<Array<FitResult>>;
}
