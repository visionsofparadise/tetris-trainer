import { DEFAULT_CONFIG, dropSteps, Mino } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { openerProblems, playPlan, playUntilPaused } from "./opener/openerChecks";
import { planScript } from "./opener/openerScript";
import { ordersByCategory } from "./opener/orders";
import { plan } from "./opener/planner";
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

const practice = (filter: PracticeSession["filter"]): PracticeSession => {
	const session = initialPractice(TKI, HANDLING);

	session.filter = filter;
	dealPractice(session, TKI, HANDLING);
	session.game.resume();

	return session;
};

describe("TKI", () => {
	it("loads every slide and builds every planned order into its positions", () => {
		expect(openerProblems(TKI)).toEqual([]);
	});

	it("finishes every buildable order with a T-spin double", () => {
		const { "no-hold": noHold, hold } = ordersByCategory(TKI);
		const misses = [...noHold, ...hold].filter((order) => {
			const spin = playPlan(TKI, order).find(({ placement }) => placement.mino === Mino.T);

			return spin?.lines !== 2 || spin.spin !== "normal";
		});

		expect(misses).toEqual([]);
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
