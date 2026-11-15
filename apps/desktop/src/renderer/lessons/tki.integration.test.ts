import { DEFAULT_CONFIG, dropSteps, Mino, samePlacement, type Game, type PlaceEvent } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { DEMO_HANDLING, loadOrder, planScript } from "./opener/openerScript";
import { ordersByCategory } from "./opener/orders";
import { plan, startState } from "./opener/planner";
import {
	declareImpossible,
	dealPractice,
	initialPractice,
	retryMistake,
	type PracticeSession,
} from "./opener/practiceSession";
import { TKI } from "./tki";

const FAST = { keyWait: 0, decisionWait: 0 };
const HANDLING = { ...DEFAULT_CONFIG.handling, sdf: 41 };
const SAMPLE_EVERY = 40;

const playUntilPaused = (game: Game): void => {
	for (let frame = 0; frame < 3000 && !game.isPaused; frame++) game.step();
};

const sampled = [
	...ordersByCategory(TKI)["no-hold"],
	...ordersByCategory(TKI).hold.filter((_order, index) => index % SAMPLE_EVERY === 0),
];

const practice = (filter: PracticeSession["filter"]): PracticeSession => {
	const session = initialPractice(TKI, HANDLING);

	session.filter = filter;
	dealPractice(session, TKI, HANDLING);
	session.game.resume();

	return session;
};

describe("TKI", () => {
	it("plays every planned order into its positions with a T-spin double", () => {
		const failures = sampled.filter((order) => {
			const decisions = plan(TKI, startState(order)) ?? [];
			const positions = decisions.flatMap((decision) => (decision.kind === "place" ? [decision.position] : []));
			const game = loadOrder(DEMO_HANDLING, order);
			const placed: Array<PlaceEvent> = [];

			game.on("place", (event) => {
				placed.push(event);

				if (placed.length === positions.length) game.pause();
			});
			game.input(planScript(decisions, FAST));
			playUntilPaused(game);

			const spin = placed.find(({ placement }) => placement.mino === Mino.T);

			return (
				placed.length !== positions.length ||
				!placed.every(
					({ placement }, index) => positions[index] && samePlacement(placement, positions[index].placement),
				) ||
				spin?.lines !== 2 ||
				spin.spin !== "normal"
			);
		});

		expect(failures).toEqual([]);
	});

	it("shows a practice mistake, retries from it and deals the next order on a clear", () => {
		const session = practice("hold");
		const first = session.state.current;

		if (first === "next-bag") throw new Error("A dealt order starts with a piece");

		session.game.input(dropSteps({ mino: first, orientation: "spawn", column: 4, row: 0 }));
		playUntilPaused(session.game);

		expect(session.status).toBe("mistake");
		expect(session.mistake?.kind).toBe("placement");
		expect(session.mistake?.best).not.toBeNull();
		expect(session.mistake?.placed).toHaveLength(4);

		retryMistake(session);
		session.game.input(planScript(plan(TKI, session.state) ?? [], FAST));
		playUntilPaused(session.game);

		expect(session.clears).toBe(1);
		expect(session.status).toBe("playing");
	});

	it("retries a new order from its own empty board after a clear", () => {
		const session = practice("no-hold");
		const finished = session.game;

		finished.input(planScript(plan(TKI, session.state) ?? [], FAST));
		playUntilPaused(finished);
		retryMistake(session);

		expect(session.clears).toBe(1);
		expect(session.game).not.toBe(finished);
		expect(session.game.board.flat().every((cell) => cell === null)).toBe(true);
	});

	it("marks an impossible call right only when the order can't be built", () => {
		const impossible = practice("impossible");
		const possible = practice("no-hold");

		declareImpossible(impossible, TKI, HANDLING);
		declareImpossible(possible, TKI, HANDLING);

		expect(impossible.clears).toBe(1);
		expect(possible.mistake?.kind).toBe("possible");
	});
});
