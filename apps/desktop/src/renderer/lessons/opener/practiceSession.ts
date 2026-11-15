import {
	placementCells,
	type Block,
	type Game,
	type GameSnapshot,
	type Handling,
	type Piece,
} from "@tetris-trainer/game";
import { ignore } from "opshot";
import { loadOrder } from "./openerScript";
import { dealOrder, type OrderFilter } from "./orders";
import {
	impossibleReason,
	isComplete,
	judge,
	plan,
	startState,
	type Decision,
	type Move,
	type PlanState,
} from "./planner";
import type { Opener } from "./Opener";
import type { Banner } from "../../models/Banner";
import type { BoardMark } from "../../models/BoardMark";

interface Checkpoint {
	readonly snapshot: GameSnapshot;
	readonly state: PlanState;
}

type PracticeStatus = "playing" | "mistake" | "cleared";

export interface PracticeSession {
	game: Game;
	filter: OrderFilter;
	order: Array<Piece>;
	state: PlanState;
	start: Checkpoint;
	checkpoint: Checkpoint;
	status: PracticeStatus;
	banner: Banner | null;
	marks: Array<BoardMark>;
}

const checkpointOf = (game: Game, state: PlanState): Checkpoint => ignore({ snapshot: game.snapshot(), state });

const NO_MARKS: Array<BoardMark> = [];

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
		banner: null,
		marks: NO_MARKS,
	};
};

const succeed = (session: PracticeSession, title: string, detail: string): void => {
	session.game.pause();
	session.status = "cleared";
	session.banner = { tone: "success", title, detail };
	session.marks = NO_MARKS;
};

const fail = (session: PracticeSession, problem: string, best: Decision | null, cells: ReadonlyArray<Block>): void => {
	session.game.pause();
	session.status = "mistake";
	session.banner = { tone: "mistake", title: problem, detail: best ? `Instead: ${best.reason}` : "" };
	session.marks = [
		...(cells.length > 0 ? [{ cells, tone: "mistake" as const }] : []),
		...(best?.kind === "place" ? [{ cells: placementCells(best.position.placement), tone: "target" as const }] : []),
	];
};

const respond = (session: PracticeSession, opener: Opener, move: Move, cells: ReadonlyArray<Block>): void => {
	if (session.status !== "playing") return;

	const verdict = judge(opener, session.state, move);

	if (!verdict.ok) {
		fail(session, verdict.problem, verdict.best, cells);

		return;
	}

	session.state = verdict.next;

	if (isComplete(opener, verdict.next))
		succeed(session, `${opener.name} built`, "The T-spin double clears two lines.");
};

export const dealPractice = (session: PracticeSession, opener: Opener, handling: Handling): void => {
	const order = dealOrder(opener, session.filter);
	const game = loadOrder(handling, order);
	const start = checkpointOf(game, startState(order));

	game.on("place", ({ placement, cells }) => respond(session, opener, { kind: "place", placement }, cells));
	game.on("hold", () => respond(session, opener, { kind: "hold" }, []));
	game.on("spawn", () => {
		if (session.status === "playing") session.checkpoint = checkpointOf(game, session.state);
	});
	game.on("topout", () => fail(session, "The stack topped out.", null, []));

	session.order = order;
	session.state = start.state;
	session.start = start;
	session.checkpoint = start;
	session.status = "playing";
	session.banner = null;
	session.marks = NO_MARKS;
	session.game = ignore(game);
};

const resumeFrom = (session: PracticeSession, checkpoint: Checkpoint): void => {
	session.game.restore(checkpoint.snapshot);
	session.state = checkpoint.state;
	session.checkpoint = checkpoint;
	session.status = "playing";
	session.banner = null;
	session.marks = NO_MARKS;
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

export const declareImpossible = (session: PracticeSession, opener: Opener): void => {
	if (session.status !== "playing") return;

	if (plan(opener, startState(session.order)) === null) {
		succeed(session, "Right, it isn't possible", impossibleReason(opener, session.order));

		return;
	}

	fail(session, `${opener.name} is possible with this order.`, plan(opener, session.state)?.[0] ?? null, []);
};
