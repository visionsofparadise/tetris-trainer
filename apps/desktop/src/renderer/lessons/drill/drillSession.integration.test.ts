import {
	DEFAULT_CONFIG,
	dropSteps,
	Game,
	Mino,
	samePlacement,
	type GameKey,
	type Piece,
	type Placement,
	type SearchState,
} from "@tetris-trainer/game";
import { createMutableState, flush, subscribe, type Operation } from "opshot";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLocalSearch } from "../../search/localSearch";
import {
	canResume,
	continueDrill,
	createDrillSession,
	dealDrill,
	retryDrill,
	retryMistake,
	setStage,
	stopDrill,
	type DrillSession,
} from "./drillSession";
import { playerOf } from "./player";
import type { Drill, DrillJudgement, DrillLock, DrillStage, JudgeContext } from "./Drill";

interface FakeState {
	readonly stage: string;
	readonly round: number;
	readonly placed: number;
	readonly passes: number;
	readonly failures: number;
}

const PAUSE: DrillStage = { id: "pause", title: "Pause", goal: "Pass two rounds.", onMistake: "pause" };
const RESTART: DrillStage = { id: "restart", title: "Restart", goal: "Pass two rounds.", onMistake: "restart" };

const FIRST: Placement = { mino: Mino.O, orientation: "spawn", column: 0, row: 0 };
const SECOND: Placement = { mino: Mino.O, orientation: "spawn", column: 2, row: 0 };
const ROUND: ReadonlyArray<Placement> = [FIRST, SECOND];

const WRONG: Placement = { mino: Mino.O, orientation: "spawn", column: 6, row: 0 };

const T_LEFT: Placement = { mino: Mino.T, orientation: "spawn", column: 0, row: 0 };

const T_MIDDLE: Placement = { mino: Mino.T, orientation: "spawn", column: 3, row: 0 };

const FRAME_MS = 1000 / 60;

const JUDGE: JudgeContext = { player: playerOf(DEFAULT_CONFIG), search: createLocalSearch() };

const FRAME_LIMIT = 600;

const isRoundOver = ({ placed }: FakeState): boolean => placed === ROUND.length;

const dealing =
	(pieces: ReadonlyArray<Piece>): Drill<FakeState>["deal"] =>
	(state, player, round) => {
		const game = new Game(player.handling);

		game.load({ board: [], validate: false, queue: { pieces, mode: "any" }, holdEnabled: true });

		return { game, state: { ...state, round: round === "next" ? state.round + 1 : state.round, placed: 0 } };
	};

const judgeRound = (state: FakeState, { event: { placement, cells } }: DrillLock): DrillJudgement<FakeState> => {
	const target = ROUND[state.placed];

	if (target !== undefined && samePlacement(placement, target))
		return { verdict: { ok: true }, next: { ...state, placed: state.placed + 1, passes: state.passes + 1 } };

	return {
		verdict: { ok: false, kind: "spot", title: "Wrong spot", placed: cells, best: target ?? null },
		next: { ...state, failures: state.failures + 1 },
	};
};

const FAKE: Drill<FakeState> = {
	stages: [PAUSE, RESTART],
	words: { next: "Next round", why: "Why" },
	start: (stage) => ({ stage: stage.id, round: 0, placed: 0, passes: 0, failures: 0 }),
	deal: dealing([Mino.O, Mino.O, Mino.O]),
	judge: judgeRound,
	isRoundOver,
	isPassed: ({ passes }) => passes >= ROUND.length * 2,
	progress: ({ passes }) => ({ label: "Passes", value: String(passes) }),
	marks: () => [],
	overlays: () => [],
	describe: (state) => JSON.stringify(state),
	onContinue: "next-round",
};

const started = (drill: Drill<FakeState> = FAKE): DrillSession<FakeState> => {
	const session = createMutableState(createDrillSession(drill));

	dealDrill(session, drill, JUDGE);

	return session;
};

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const lockNext = (game: Game): void => {
	let placed = false;
	const off = game.on("place", () => (placed = true));

	for (let frame = 0; frame < FRAME_LIMIT && !placed; frame++) game.step();

	off();
};

const play = (game: Game, placement: Placement): void => {
	game.input(dropSteps(placement));
	lockNext(game);
};

const tapKey = (game: Game, key: GameKey): void => {
	game.press(key);
	game.step(2);
	game.release(key);
	game.step(2);
};

const playRound = async (session: DrillSession<FakeState>): Promise<void> => {
	for (const placement of ROUND) play(session.game, placement);

	await settle();
};

const heard = (session: DrillSession<FakeState>): Array<Operation> => {
	const operations: Array<Operation> = [];

	subscribe(session, (emitted) => operations.push(...emitted));

	return operations;
};

const keysOf = (operations: ReadonlyArray<Operation>): Array<string> => operations.map(({ key }) => key);

const filled = (game: Game): number => game.board.flat().filter((cell) => cell !== null).length;

const gate = (): { readonly opened: Promise<void>; readonly open: () => void } => {
	let open = (): void => {};
	const opened = new Promise<void>((resolve) => (open = resolve));

	return { opened, open };
};

const gatedFirst =
	(seen: Array<DrillLock>, opened: Promise<void>): Drill<FakeState>["judge"] =>
	async (state, lock) => {
		seen.push(lock);

		if (seen.length === 1) await opened;

		return judgeRound(state, lock);
	};

const recording =
	(seen: Array<DrillLock>): Drill<FakeState>["judge"] =>
	(state, lock) => {
		seen.push(lock);

		return judgeRound(state, lock);
	};

const columnsOf = (seen: ReadonlyArray<DrillLock>): Array<number> => seen.map(({ event }) => event.placement.column);

const rowsOf = ({ board }: SearchState): Array<number> => Array.from(board.rows.slice(0, 2));

afterEach(() => {
	vi.restoreAllMocks();
});

describe("drill session", () => {
	it("lets a subscriber hear a pass, a round clear and a mistake", async () => {
		const session = started();
		const operations = heard(session);

		flush(session);
		operations.length = 0;

		play(session.game, FIRST);
		await settle();
		flush(session);

		expect(keysOf(operations)).toContain("state");
		expect(keysOf(operations)).not.toContain("clears");
		expect(session.state.passes).toBe(1);

		operations.length = 0;
		play(session.game, SECOND);
		await settle();
		flush(session);

		expect(keysOf(operations)).toEqual(expect.arrayContaining(["state", "clears", "game"]));
		expect(session.clears).toBe(1);
		expect(session.state).toMatchObject({ round: 1, placed: 0 });

		operations.length = 0;
		play(session.game, WRONG);
		await settle();
		flush(session);

		expect(keysOf(operations)).toEqual(expect.arrayContaining(["state", "status", "mistake"]));
		expect(session.status).toBe("mistake");
		expect(session.mistake).toMatchObject({ kind: "spot", title: "Wrong spot", best: FIRST });
		expect(session.mistake?.placed).toHaveLength(4);
	});

	it("judges queued locks one at a time in lock order", async () => {
		const seen: Array<DrillLock> = [];
		const { opened, open } = gate();
		const session = started({ ...FAKE, judge: gatedFirst(seen, opened) });

		play(session.game, FIRST);
		play(session.game, SECOND);
		await settle();

		expect(columnsOf(seen)).toEqual([0]);
		expect(session.pending).toBe(2);
		expect(session.state.passes).toBe(0);

		open();
		await settle();

		expect(columnsOf(seen)).toEqual([0, 2]);
		expect(session.clears).toBe(1);
		expect(session.state).toMatchObject({ round: 1, passes: 2 });
		expect(session.pending).toBe(0);
	});

	it("shows a failure on the first of two queued locks on its own board and drops the second", async () => {
		const seen: Array<DrillLock> = [];
		const { opened, open } = gate();
		const session = started({ ...FAKE, judge: gatedFirst(seen, opened) });

		play(session.game, WRONG);
		play(session.game, FIRST);
		open();
		await settle();

		expect(session.status).toBe("mistake");
		expect(columnsOf(seen)).toEqual([6]);
		expect(session.state).toMatchObject({ passes: 0, failures: 1 });
		expect(session.pending).toBe(0);
		expect(session.game.isPaused).toBe(true);
		expect(filled(session.game)).toBe(4);
		expect(session.game.board[0]?.[6]).toBe(Mino.O);
	});

	it("shows the board from before the lock when the mistake asks for it", async () => {
		const showingBefore: Drill<FakeState>["judge"] = (state, lock) => {
			const judgement = judgeRound(state, lock);

			return judgement.verdict.ok
				? judgement
				: { ...judgement, verdict: { ...judgement.verdict, showsBefore: true } };
		};
		const session = started({ ...FAKE, judge: showingBefore });

		play(session.game, FIRST);
		play(session.game, WRONG);
		await settle();

		expect(session.status).toBe("mistake");
		expect(filled(session.game)).toBe(4);
		expect(session.game.board[0]?.[0]).toBe(Mino.O);
		expect(session.game.board[0]?.[6]).toBeNull();
	});

	it("retries a failure from its piece's spawn, keeping the failure, and judges the next lock from there", async () => {
		const seen: Array<DrillLock> = [];
		const drill = { ...FAKE, judge: recording(seen) };
		const session = started(drill);

		play(session.game, FIRST);
		play(session.game, WRONG);
		await settle();

		expect(session.state).toMatchObject({ passes: 1, failures: 1 });

		retryMistake(session, drill, JUDGE);

		expect(session.status).toBe("playing");
		expect(session.mistake).toBeNull();
		expect(session.state).toMatchObject({ placed: 1, passes: 1, failures: 1 });
		expect(filled(session.game)).toBe(4);

		play(session.game, SECOND);
		await settle();

		expect(seen.map(({ before }) => rowsOf(before))).toEqual([
			[0, 0],
			[0b11, 0b11],
			[0b11, 0b11],
		]);
		expect(session.clears).toBe(1);
	});

	it("keeps a piece's spawn as its checkpoint and judging start through a hold", async () => {
		const seen: Array<DrillLock> = [];
		const session = started({ ...FAKE, deal: dealing([Mino.O, Mino.I, Mino.O]), judge: recording(seen) });

		tapKey(session.game, "hold");
		play(session.game, { mino: Mino.I, orientation: "spawn", column: 6, row: 0 });
		await settle();

		expect(seen[0]?.before).toMatchObject({ current: Mino.O, hold: null });
		expect(seen[0]?.after).toMatchObject({ hold: Mino.O });
		expect(session.status).toBe("mistake");

		retryMistake(session, FAKE, JUDGE);

		expect(session.game.hold).toBeNull();
		expect(session.game.falling.mino).toBe(Mino.O);
	});

	it("plays app-owned pieces with the player's input off and gives the player's next piece back", async () => {
		const spawns: Array<SearchState> = [];
		const owning: Drill<FakeState> = {
			...FAKE,
			deal: dealing([Mino.T, Mino.O, Mino.T, Mino.O]),
			judge: (state) => ({ verdict: { ok: true }, next: { ...state, placed: state.placed + 1 } }),
			isRoundOver: () => false,
			owns: (_state, mino) => mino === Mino.T,
			delegate: (_state, spawn) => {
				spawns.push(spawn);

				return Promise.resolve(dropSteps(T_LEFT));
			},
		};
		const session = started(owning);
		const { game } = session;

		expect(session.owner).toBe("demo");
		expect(game.isPaused).toBe(true);

		await settle();
		game.press("moveRight");
		lockNext(game);

		expect(game.board[0]?.slice(0, 4)).toEqual([Mino.T, Mino.T, Mino.T, null]);
		expect(session.owner).toBe("user");
		expect(game.isPaused).toBe(false);

		tapKey(game, "moveRight");
		tapKey(game, "hardDrop");

		expect(game.board[0]?.slice(4, 7)).toEqual([null, Mino.O, Mino.O]);
		expect(session.owner).toBe("demo");
		expect(game.isPaused).toBe(true);

		await settle();

		expect(spawns.map(({ current }) => current)).toEqual([Mino.T, Mino.T]);
		expect(spawns[1]?.board.rows[0]).toBe(0b1100111);
		expect(game.isPaused).toBe(false);
	});

	it("passes a lock whose judgement rejects", async () => {
		const failed = vi.spyOn(console, "error").mockImplementation(() => {});
		const session = started({ ...FAKE, judge: () => Promise.reject(new Error("The search worker raised error")) });

		play(session.game, WRONG);
		await settle();

		expect(session.status).toBe("playing");
		expect(session.state).toMatchObject({ placed: 0, failures: 0 });
		expect(session.pending).toBe(0);
		expect(failed).toHaveBeenCalledOnce();
	});

	it("reports a top-out, and retries it from the last lock's spawn", async () => {
		const session = started();

		play(session.game, FIRST);
		session.game.addGarbage({ column: 0, amount: 40 });
		await settle();

		expect(session.status).toBe("mistake");
		expect(session.mistake).toEqual({ kind: "top-out", title: "Top out", placed: null, best: null });

		retryMistake(session, FAKE, JUDGE);

		expect(filled(session.game)).toBe(0);
		expect(session.state).toMatchObject({ placed: 0, passes: 0 });
	});

	it("shows a pending failure in place of a top-out", async () => {
		const seen: Array<DrillLock> = [];
		const { opened, open } = gate();
		const session = started({ ...FAKE, judge: gatedFirst(seen, opened) });

		play(session.game, WRONG);
		session.game.addGarbage({ column: 0, amount: 40 });
		open();
		await settle();

		expect(session.mistake).toMatchObject({ kind: "spot", title: "Wrong spot" });
	});

	it("resumes from the failed lock when the drill continues in place", async () => {
		const seen: Array<DrillLock> = [];
		const resuming: Drill<FakeState> = { ...FAKE, judge: recording(seen), onContinue: "resume" };
		const session = started(resuming);

		play(session.game, FIRST);
		play(session.game, WRONG);
		await settle();
		continueDrill(session, resuming, JUDGE);

		expect(session.status).toBe("playing");
		expect(filled(session.game)).toBe(8);
		expect(session.state).toMatchObject({ round: 0, placed: 1, failures: 1 });

		play(session.game, SECOND);
		await settle();

		expect(seen[2]?.before.board.rows[0]).toBe(0b11000011);
		expect(session.clears).toBe(1);
	});

	it("deals the same round again on a redeal and the next round on a pause-mode continue", async () => {
		const session = started();

		play(session.game, WRONG);
		await settle();
		retryMistake(session, FAKE, JUDGE);
		dealDrill(session, FAKE, JUDGE);

		expect(session.state).toMatchObject({ round: 0, failures: 1 });

		play(session.game, WRONG);
		await settle();
		continueDrill(session, FAKE, JUDGE);

		expect(session.state).toMatchObject({ round: 1, failures: 2 });
	});

	it("resets the state on a restart-mode continue", async () => {
		const session = started();

		setStage(session, FAKE, JUDGE, RESTART);
		play(session.game, FIRST);
		play(session.game, WRONG);
		await settle();
		continueDrill(session, FAKE, JUDGE);

		expect(session.status).toBe("playing");
		expect(session.state).toEqual({ stage: "restart", round: 0, placed: 0, passes: 0, failures: 0 });
	});

	it("restarts the run on a retry mid-piece in a restart-mode stage and only the piece in a pause-mode one", async () => {
		const seen: Array<DrillLock> = [];
		const drill = { ...FAKE, judge: recording(seen) };
		const session = started(drill);

		play(session.game, FIRST);
		await settle();
		session.game.press("moveRight");
		session.game.step(2);
		retryDrill(session, drill, JUDGE);

		expect(session.state).toMatchObject({ round: 0, placed: 1, passes: 1 });
		expect(filled(session.game)).toBe(4);
		expect(session.game.falling.blocks).toEqual(started(drill).game.falling.blocks);

		play(session.game, SECOND);
		await settle();

		expect(seen.map(({ before }) => rowsOf(before))).toEqual([
			[0, 0],
			[0b11, 0b11],
		]);
		expect(session.clears).toBe(1);

		setStage(session, drill, JUDGE, RESTART);
		play(session.game, FIRST);
		await settle();
		session.game.press("moveRight");
		session.game.step(2);
		retryDrill(session, drill, JUDGE);

		expect(session.status).toBe("playing");
		expect(session.state).toEqual({ stage: "restart", round: 0, placed: 0, passes: 0, failures: 0 });
	});

	it("ignores a game it has dealt away", async () => {
		const session = started();
		const stale = session.game;

		dealDrill(session, FAKE, JUDGE);
		play(stale, WRONG);
		await settle();

		expect(session.game).not.toBe(stale);
		expect(session.status).toBe("playing");
		expect(session.state.failures).toBe(0);
	});

	it("ignores a verdict that arrives after its game was dealt away", async () => {
		const seen: Array<DrillLock> = [];
		const { opened, open } = gate();
		const drill = { ...FAKE, judge: gatedFirst(seen, opened) };
		const session = started(drill);

		play(session.game, WRONG);
		await settle();
		dealDrill(session, drill, JUDGE);
		open();
		await settle();

		expect(seen).toHaveLength(1);
		expect(session.status).toBe("playing");
		expect(session.state.failures).toBe(0);
	});

	it("resets the state on a stage change and keeps the stages passed", async () => {
		const session = started();

		await playRound(session);
		await playRound(session);

		expect(session.passed).toEqual(["pause"]);

		setStage(session, FAKE, JUDGE, RESTART);

		expect(session.stage).toBe(RESTART);
		expect(session.state).toEqual({ stage: "restart", round: 0, placed: 0, passes: 0, failures: 0 });
		expect(session.passed).toEqual(["pause"]);
	});

	it("plays an app-owned piece from its spawn when a direction is held through the player's hard drop", async () => {
		const owning: Drill<FakeState> = {
			...FAKE,
			deal: dealing([Mino.O, Mino.T, Mino.O, Mino.O]),
			judge: (state) => ({ verdict: { ok: true }, next: { ...state, placed: state.placed + 1 } }),
			isRoundOver: () => false,
			owns: (_state, mino) => mino === Mino.T,
			delegate: () => Promise.resolve(dropSteps(T_MIDDLE)),
		};
		const session = started(owning);
		const { game } = session;
		const columns: Array<string> = [];

		game.on("place", ({ placement }) => columns.push(`${placement.mino}@${placement.column}`));
		game.press("moveLeft");
		game.step(30);
		game.press("hardDrop");
		game.advance(FRAME_MS * 3);
		game.release("hardDrop");
		game.release("moveLeft");
		await settle();

		for (let frame = 0; frame < FRAME_LIMIT && columns.length < 2; frame++) game.advance(FRAME_MS);

		expect(columns).toEqual(["o@0", "t@3"]);
	});

	it("gives an app-owned piece that comes out of hold to the app", async () => {
		const spawns: Array<SearchState> = [];
		const owning: Drill<FakeState> = {
			...FAKE,
			deal: dealing([Mino.O, Mino.T, Mino.O, Mino.O]),
			judge: (state) => ({ verdict: { ok: true }, next: { ...state, placed: state.placed + 1 } }),
			isRoundOver: () => false,
			owns: (_state, mino) => mino === Mino.T,
			delegate: (_state, spawn) => {
				spawns.push(spawn);

				return Promise.resolve(dropSteps(T_MIDDLE));
			},
		};
		const session = started(owning);
		const { game } = session;
		const placed: Array<string> = [];

		game.on("place", ({ placement, inputs }) =>
			placed.push(
				`${placement.mino}@${placement.column} by ${[...new Set(inputs.map(({ source }) => source))].join("+")}`,
			),
		);
		tapKey(game, "hold");

		expect(session.owner).toBe("demo");
		expect(game.isPaused).toBe(true);

		await settle();
		lockNext(game);

		expect(placed).toEqual(["t@3 by script"]);
		expect(spawns).toMatchObject([{ current: Mino.T, hold: Mino.O, holdLocked: true }]);
		expect(session.owner).toBe("user");
	});

	it("offers no resume after a failing lock that also topped out", async () => {
		const failing: Drill<FakeState> = {
			...FAKE,
			deal: dealing(Array.from({ length: 30 }, () => Mino.O)),
			judge: (state, { event }) => ({
				verdict: { ok: false, kind: "spot", title: "Wrong spot", placed: event.cells, best: null },
				next: { ...state, failures: state.failures + 1 },
			}),
			onContinue: "resume",
		};
		const session = started(failing);
		let toppedOut = false;

		session.game.on("topout", () => (toppedOut = true));

		for (let lock = 0; lock < 15 && !toppedOut; lock++) {
			if (lock > 0) continueDrill(session, failing, JUDGE);

			tapKey(session.game, "hardDrop");
			await settle();

			expect(session.mistake?.kind).toBe("spot");
			expect(canResume(session, failing)).toBe(!toppedOut);
		}

		expect(toppedOut).toBe(true);

		continueDrill(session, failing, JUDGE);

		expect(session.status).toBe("playing");
		expect(session.state.round).toBe(1);
		expect(filled(session.game)).toBe(0);
	});

	it("applies no judgement and plays no app piece once stopped", async () => {
		const seen: Array<DrillLock> = [];
		const { opened, open } = gate();
		const delegated: Array<SearchState> = [];
		const drill: Drill<FakeState> = {
			...FAKE,
			deal: dealing([Mino.O, Mino.T, Mino.O]),
			judge: gatedFirst(seen, opened),
			owns: (_state, mino) => mino === Mino.T,
			delegate: (_state, spawn) => {
				delegated.push(spawn);

				return Promise.resolve(dropSteps(T_MIDDLE));
			},
		};
		const session = started(drill);

		play(session.game, WRONG);
		stopDrill(session);
		open();
		await settle();

		expect(session.status).toBe("playing");
		expect(session.state.failures).toBe(0);
		expect(delegated).toEqual([]);
		expect(session.game.isPaused).toBe(true);
	});
});
