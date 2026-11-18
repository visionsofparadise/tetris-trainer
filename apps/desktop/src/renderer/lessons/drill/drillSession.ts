import {
	isPiece,
	type Game,
	type GameSnapshot,
	type Mino,
	type PlaceEvent,
	type ScriptStep,
	type SearchState,
} from "@tetris-trainer/game";
import { ignore } from "opshot";
import { searchStateOf } from "../../search/searchStateOf";
import { pausedGame } from "./pausedGame";
import type { Drill, DrillJudgement, DrillLock, DrillMistake, DrillRound, DrillStage, JudgeContext } from "./Drill";

type DrillStatus = "playing" | "mistake";

type DrillOwner = "user" | "demo";

interface LockRecord<S> {
	readonly checkpoint: GameSnapshot;
	readonly placed: GameSnapshot;
	readonly before: SearchState;
	readonly stateBefore: S;
}

interface PlayPoint<S> {
	readonly snapshot: GameSnapshot;
	readonly before: SearchState;
	readonly state: S;
}

interface JudgeQueue<S> {
	readonly game: Game;
	tail: Promise<void>;
	before: SearchState;
	last: LockRecord<S> | null;
}

interface Recovery<S> {
	readonly retry: PlayPoint<S>;
	readonly resume: PlayPoint<S> | null;
}

export interface DrillSession<S, T extends DrillStage = DrillStage> {
	game: Game;
	state: S;
	stage: T;
	checkpoint: GameSnapshot;
	status: DrillStatus;
	mistake: DrillMistake | null;
	clears: number;
	passed: ReadonlyArray<string>;
	pending: number;
	owner: DrillOwner;
	queue: JudgeQueue<S>;
	recovery: Recovery<S> | null;
}

interface CapturedLock<S> extends DrillLock {
	readonly record: Omit<LockRecord<S>, "stateBefore">;
}

const TOP_OUT: DrillMistake = { kind: "top-out", title: "Top out", placed: null, best: null };

const SEED_MODULUS = 2147483647;

const randomSeed = (): number => 1 + Math.floor(Math.random() * (SEED_MODULUS - 1));

const queueOn = <S>(game: Game, before: SearchState): JudgeQueue<S> => ({
	game,
	tail: Promise.resolve(),
	before,
	last: null,
});

export const createDrillSession = <S, T extends DrillStage>(drill: Drill<S, T>): DrillSession<S, T> => {
	const [stage] = drill.stages;

	if (stage === undefined) throw new Error("A drill needs at least one stage");

	const game = pausedGame();

	return {
		game: ignore(game),
		state: ignore(drill.start(stage, randomSeed())),
		stage: ignore(stage),
		checkpoint: ignore(game.snapshot()),
		status: "playing",
		mistake: null,
		clears: 0,
		passed: [],
		pending: 0,
		owner: "user",
		queue: ignore(queueOn(game, searchStateOf(game))),
		recovery: null,
	};
};

const isCurrent = <S, T extends DrillStage>(session: DrillSession<S, T>, queue: JudgeQueue<S>): boolean =>
	session.status === "playing" && session.queue === queue;

const isOwned = <S, T extends DrillStage>(drill: Drill<S, T>, state: S, mino: Mino): boolean =>
	isPiece(mino) && drill.delegate !== undefined && drill.owns?.(state, mino) === true;

const enqueue = <S>(queue: JudgeQueue<S>, job: () => void | Promise<void>): void => {
	queue.tail = queue.tail.then(job).catch((error: unknown) => {
		console.error("A queued drill step failed", error);
	});
};

const fail = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	mistake: DrillMistake,
	recovery: Recovery<S>,
): void => {
	session.game.pause();
	session.status = "mistake";
	session.mistake = ignore(mistake);
	session.recovery = ignore(recovery);
	session.pending = 0;
};

const handBack = <S, T extends DrillStage>(session: DrillSession<S, T>): void => {
	session.owner = "user";
	session.game.setUserInput(true);
};

const delegateTurn = async <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	queue: JudgeQueue<S>,
	play: () => Promise<ReadonlyArray<ScriptStep>>,
): Promise<void> => {
	try {
		await queue.tail;

		if (!isCurrent(session, queue)) return;

		const keys = await play();

		if (!isCurrent(session, queue)) return;

		queue.game.input(keys);
	} catch (error) {
		console.error("The drill could not play its piece, so the player plays it", error);

		if (isCurrent(session, queue)) handBack(session);
	}

	if (isCurrent(session, queue)) queue.game.resume();
};

const claimTurn = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
): void => {
	const { game, queue, state } = session;
	const { delegate } = drill;

	if (!delegate || !isOwned(drill, state, game.falling.mino)) return;

	const spawn = queue.before;

	game.pause();
	game.setUserInput(false);
	session.owner = "demo";
	void delegateTurn(session, queue, () => delegate(session.state, spawn, context));
};

const playFrom = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
	{ snapshot, before, state }: PlayPoint<S>,
): void => {
	const { game } = session;

	session.state = ignore(state);
	session.checkpoint = ignore(snapshot);
	session.status = "playing";
	session.mistake = null;
	session.recovery = null;
	session.pending = 0;
	session.queue = ignore(queueOn(game, before));
	handBack(session);
	game.resume();
	claimTurn(session, drill, context);
};

const judged = async <S, T extends DrillStage>(
	drill: Drill<S, T>,
	state: S,
	lock: DrillLock,
	context: JudgeContext,
): Promise<DrillJudgement<S>> => {
	try {
		return await drill.judge(state, lock, context);
	} catch (error) {
		console.error("A drill judgement failed, so the lock passes", error);

		return { verdict: { ok: true }, next: state };
	}
};

const judgeLock = async <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
	queue: JudgeQueue<S>,
	{ record, ...lock }: CapturedLock<S>,
): Promise<void> => {
	if (!isCurrent(session, queue)) return;

	const stateBefore = session.state;
	const { verdict, next } = await judged(drill, stateBefore, lock, context);

	if (!isCurrent(session, queue)) return;

	queue.last = { ...record, stateBefore };
	session.pending--;
	session.state = ignore(next);

	if (!verdict.ok) {
		queue.game.restore(record.placed);
		fail(session, verdict, {
			retry: { snapshot: record.checkpoint, before: record.before, state: next },
			resume: { snapshot: record.placed, before: lock.after, state: next },
		});

		return;
	}

	const { id } = session.stage;

	if (drill.isPassed(next) && !session.passed.includes(id)) session.passed = [...session.passed, id];

	if (drill.isRoundOver(next)) {
		queue.game.pause();
		session.clears++;
		deal(session, drill, context, "next");
	}
};

const capture = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
	event: PlaceEvent,
): void => {
	const { game, queue, checkpoint } = session;
	const after = searchStateOf(game);
	const lock: CapturedLock<S> = {
		event,
		before: queue.before,
		after,
		record: { checkpoint, placed: game.snapshot(), before: queue.before },
	};

	queue.before = after;
	enqueue(queue, () => judgeLock(session, drill, context, queue, lock));
	session.pending++;
	claimTurn(session, drill, context);
};

const topOut = <S, T extends DrillStage>(session: DrillSession<S, T>): void => {
	const { game, queue } = session;

	game.pause();
	enqueue(queue, () => {
		if (!isCurrent(session, queue)) return;

		const { last } = queue;
		const retry: PlayPoint<S> = last
			? { snapshot: last.checkpoint, before: last.before, state: last.stateBefore }
			: { snapshot: session.checkpoint, before: queue.before, state: session.state };

		fail(session, TOP_OUT, { retry, resume: null });
	});
};

const deal = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
	round: DrillRound,
): void => {
	const { game, state } = drill.deal(session.state, context.player, round);

	const isActive = (): boolean => session.status === "playing" && session.game === game;

	game.on("spawn", ({ mino, fromHold }) => {
		if (!isActive() || fromHold) return;

		session.checkpoint = ignore(game.snapshot());

		if (session.owner === "demo" && !isOwned(drill, session.state, mino)) handBack(session);
	});
	game.on("place", (event) => {
		if (isActive()) capture(session, drill, context, event);
	});
	game.on("topout", () => {
		if (isActive()) topOut(session);
	});

	session.game = ignore(game);
	playFrom(session, drill, context, { snapshot: game.snapshot(), before: searchStateOf(game), state });
};

export const dealDrill = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
): void => deal(session, drill, context, "same");

const restoreTo = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
	point: PlayPoint<S>,
): void => {
	session.game.restore(point.snapshot);
	playFrom(session, drill, context, point);
};

export const retryMistake = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
): void => {
	const { recovery } = session;

	if (recovery) restoreTo(session, drill, context, recovery.retry);
};

export const continueDrill = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
): void => {
	const { stage, recovery } = session;

	if (stage.onMistake === "restart") {
		session.state = ignore(drill.start(stage, randomSeed()));
		dealDrill(session, drill, context);
	} else if (drill.onContinue === "resume" && recovery?.resume) restoreTo(session, drill, context, recovery.resume);
	else deal(session, drill, context, "next");
};

export const retryDrill = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
): void => {
	if (session.stage.onMistake === "restart") continueDrill(session, drill, context);
	else if (session.status === "playing") dealDrill(session, drill, context);
	else retryMistake(session, drill, context);
};

export const setStage = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	context: JudgeContext,
	stage: T,
): void => {
	session.stage = ignore(stage);
	session.state = ignore(drill.start(stage, randomSeed()));
	dealDrill(session, drill, context);
};
