import { DEFAULT_CONFIG, dropSteps, Game, Mino, samePlacement, type Placement } from "@tetris-trainer/game";
import { createMutableState, flush, subscribe, type Operation } from "opshot";
import { describe, expect, it } from "vitest";
import {
	continueDrill,
	createDrillSession,
	dealDrill,
	redealRound,
	retryMistake,
	setStage,
	type DrillSession,
} from "./drillSession";
import { playerOf } from "./player";
import type { Drill, DrillStage } from "./Drill";

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

const PLAYER = playerOf(DEFAULT_CONFIG);

const isRoundOver = ({ placed }: FakeState): boolean => placed === ROUND.length;

const FAKE: Drill<FakeState> = {
	stages: [PAUSE, RESTART],
	start: (stage) => ({ stage: stage.id, round: 0, placed: 0, passes: 0, failures: 0 }),
	deal: (state, player) => {
		const game = new Game(player.handling);

		game.load({
			board: [],
			validate: false,
			queue: { pieces: [Mino.O, Mino.O, Mino.O], mode: "any" },
			holdEnabled: false,
		});

		return { game, state: { ...state, round: isRoundOver(state) ? state.round + 1 : state.round, placed: 0 } };
	},
	judge: (state, { placement, cells }) => {
		const target = ROUND[state.placed];

		if (target !== undefined && samePlacement(placement, target))
			return { verdict: { ok: true }, next: { ...state, placed: state.placed + 1, passes: state.passes + 1 } };

		return {
			verdict: { ok: false, kind: "spot", title: "Wrong spot", placed: cells, best: target ?? null },
			next: { ...state, failures: state.failures + 1 },
		};
	},
	isRoundOver,
	isPassed: ({ passes }) => passes >= ROUND.length * 2,
	progress: ({ passes }) => ({ label: "Passes", value: String(passes) }),
	marks: () => [],
	describe: (state) => JSON.stringify(state),
};

const FRAME_LIMIT = 600;

const started = (): DrillSession<FakeState> => {
	const session = createMutableState(createDrillSession(FAKE));

	dealDrill(session, FAKE, PLAYER);

	return session;
};

const play = (game: Game, placement: Placement): void => {
	let placed = false;
	const off = game.on("place", () => (placed = true));

	game.input(dropSteps(placement));

	for (let frame = 0; frame < FRAME_LIMIT && !placed; frame++) game.step();

	off();
};

const playRound = (session: DrillSession<FakeState>): void => {
	for (const placement of ROUND) play(session.game, placement);
};

const heard = (session: DrillSession<FakeState>): Array<Operation> => {
	const operations: Array<Operation> = [];

	subscribe(session, (emitted) => operations.push(...emitted));

	return operations;
};

const keysOf = (operations: ReadonlyArray<Operation>): Array<string> => operations.map(({ key }) => key);

describe("drill session", () => {
	it("lets a subscriber hear a pass, a round clear and a mistake", () => {
		const session = started();
		const operations = heard(session);

		flush(session);
		operations.length = 0;

		play(session.game, FIRST);
		flush(session);

		expect(keysOf(operations)).toContain("state");
		expect(keysOf(operations)).not.toContain("clears");
		expect(session.state.passes).toBe(1);

		operations.length = 0;
		play(session.game, SECOND);
		flush(session);

		expect(keysOf(operations)).toEqual(expect.arrayContaining(["state", "clears", "game"]));
		expect(session.clears).toBe(1);
		expect(session.state).toMatchObject({ round: 1, placed: 0 });

		operations.length = 0;
		play(session.game, WRONG);
		flush(session);

		expect(keysOf(operations)).toEqual(expect.arrayContaining(["state", "status", "mistake"]));
		expect(session.status).toBe("mistake");
		expect(session.mistake).toMatchObject({ kind: "spot", title: "Wrong spot", best: FIRST });
		expect(session.mistake?.placed).toHaveLength(4);
	});

	it("records a failure and retries it from the failed piece's own spawn", () => {
		const session = started();

		play(session.game, FIRST);
		play(session.game, WRONG);

		expect(session.status).toBe("mistake");
		expect(session.state.failures).toBe(1);

		retryMistake(session);

		expect(session.status).toBe("playing");
		expect(session.mistake).toBeNull();
		expect(session.state.failures).toBe(1);
		expect(session.game.board.flat().filter((cell) => cell !== null)).toHaveLength(4);

		play(session.game, SECOND);

		expect(session.clears).toBe(1);
	});

	it("resets the state on a restart-mode continue", () => {
		const session = started();

		setStage(session, FAKE, PLAYER, RESTART);
		play(session.game, FIRST);
		play(session.game, WRONG);
		continueDrill(session, FAKE, PLAYER);

		expect(session.status).toBe("playing");
		expect(session.state).toEqual({ stage: "restart", round: 0, placed: 0, passes: 0, failures: 0 });
	});

	it("reports a top-out", () => {
		const session = started();

		session.game.addGarbage({ column: 0, amount: 40 });

		expect(session.status).toBe("mistake");
		expect(session.mistake).toEqual({ kind: "top-out", title: "Top out", placed: null, best: null });
	});

	it("ignores a game it has dealt away", () => {
		const session = started();
		const stale = session.game;

		redealRound(session, FAKE, PLAYER);
		play(stale, WRONG);

		expect(session.game).not.toBe(stale);
		expect(session.status).toBe("playing");
		expect(session.state.failures).toBe(0);
	});

	it("resets the state on a stage change and keeps the stages passed", () => {
		const session = started();

		playRound(session);
		playRound(session);

		expect(session.passed).toEqual(["pause"]);

		setStage(session, FAKE, PLAYER, RESTART);

		expect(session.stage).toBe(RESTART);
		expect(session.state).toEqual({ stage: "restart", round: 0, placed: 0, passes: 0, failures: 0 });
		expect(session.passed).toEqual(["pause"]);
	});
});
