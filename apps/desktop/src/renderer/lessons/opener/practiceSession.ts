import { ignore } from "opshot";
import { loadOrder } from "./openerScript";
import { dealOrder, type OrderFilter } from "./orders";
import {
	isComplete,
	judge,
	plan,
	startState,
	type Mistake,
	type MistakeKind,
	type Move,
	type PlanState,
} from "./planner";
import type { Opener } from "./Opener";
import type { Block, Game, GameSnapshot, Handling, Piece } from "@tetris-trainer/game";

interface Checkpoint {
	readonly snapshot: GameSnapshot;
	readonly state: PlanState;
}

type PracticeStatus = "playing" | "mistake";

export type PracticeMistakeKind = MistakeKind | "possible" | "top-out";

export interface PracticeMistake extends Omit<Mistake, "kind"> {
	readonly kind: PracticeMistakeKind;
	readonly placed: ReadonlyArray<Block> | "hold" | null;
}

export interface PracticeSession {
	game: Game;
	filter: OrderFilter;
	order: Array<Piece>;
	state: PlanState;
	start: Checkpoint;
	checkpoint: Checkpoint;
	status: PracticeStatus;
	mistake: PracticeMistake | null;
	clears: number;
}

const checkpointOf = (game: Game, state: PlanState): Checkpoint => ignore({ snapshot: game.snapshot(), state });

export const initialPractice = (opener: Opener, handling: Handling): PracticeSession => {
	const order = dealOrder(opener, "no-hold");
	const game = loadOrder(handling, order);
	const start = checkpointOf(game, startState(order));

	game.pause();

	return {
		game: ignore(game),
		filter: "no-hold",
		order,
		state: start.state,
		start,
		checkpoint: start,
		status: "playing",
		mistake: null,
		clears: 0,
	};
};

const fail = (session: PracticeSession, mistake: PracticeMistake): void => {
	session.game.pause();
	session.status = "mistake";
	session.mistake = ignore(mistake);
};

const clear = (session: PracticeSession, opener: Opener, handling: Handling): void => {
	session.game.pause();
	session.clears++;
	dealPractice(session, opener, handling);
};

export const dealPractice = (session: PracticeSession, opener: Opener, handling: Handling): void => {
	const order = dealOrder(opener, session.filter);
	const game = loadOrder(handling, order);
	const start = checkpointOf(game, startState(order));

	const isActive = (): boolean => session.status === "playing" && session.game === game;

	const respond = (move: Move, placed: PracticeMistake["placed"]): void => {
		if (!isActive()) return;

		const verdict = judge(opener, session.state, move);

		if (!verdict.ok) {
			fail(session, { kind: verdict.kind, detail: verdict.detail, best: verdict.best, placed });

			return;
		}

		session.state = verdict.next;

		if (isComplete(opener, verdict.next)) clear(session, opener, handling);
	};

	game.on("place", ({ placement, cells }) => respond({ kind: "place", placement }, cells));
	game.on("hold", () => respond({ kind: "hold" }, "hold"));
	game.on("spawn", () => {
		if (isActive()) session.checkpoint = checkpointOf(game, session.state);
	});
	game.on("topout", () => {
		if (isActive()) fail(session, { kind: "top-out", placed: null, best: null });
	});

	session.order = order;
	session.state = start.state;
	session.start = start;
	session.checkpoint = start;
	session.status = "playing";
	session.mistake = null;
	session.game = ignore(game);
};

const resumeFrom = (session: PracticeSession, checkpoint: Checkpoint): void => {
	session.game.restore(checkpoint.snapshot);
	session.state = checkpoint.state;
	session.checkpoint = checkpoint;
	session.status = "playing";
	session.mistake = null;
	session.game.resume();
};

export const setPracticeFilter = (
	session: PracticeSession,
	opener: Opener,
	handling: Handling,
	filter: OrderFilter,
): void => {
	session.filter = filter;
	dealPractice(session, opener, handling);
};

export const retryMistake = (session: PracticeSession): void => resumeFrom(session, session.checkpoint);

export const restartOrder = (session: PracticeSession): void => resumeFrom(session, session.start);

export const declareImpossible = (session: PracticeSession, opener: Opener, handling: Handling): void => {
	if (session.status !== "playing") return;

	if (plan(opener, startState(session.order)) === null) clear(session, opener, handling);
	else fail(session, { kind: "possible", placed: null, best: plan(opener, session.state)?.[0] ?? null });
};
