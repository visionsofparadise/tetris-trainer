import { DEFAULT_CONFIG, dropSteps, Mino, type Piece } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { openerProblems, playPlan, playUntilPaused } from "./opener/openerChecks";
import { planScript } from "./opener/openerScript";
import { categorize, ordersByCategory } from "./opener/orders";
import { plan, startState } from "./opener/planner";
import {
	declareImpossible,
	dealPractice,
	initialPractice,
	retryMistake,
	type PracticeSession,
} from "./opener/practiceSession";
import { RELIABLE_TSD } from "./reliableTsd";

const FAST = { keyWait: 0, decisionWait: 0 };
const HANDLING = { ...DEFAULT_CONFIG.handling, sdf: 41 };

const practice = (filter: PracticeSession["filter"]): PracticeSession => {
	const session = initialPractice(RELIABLE_TSD, HANDLING);

	session.filter = filter;
	dealPractice(session, RELIABLE_TSD, HANDLING);
	session.game.resume();

	return session;
};

const comesBefore = (order: ReadonlyArray<Piece>, first: Piece, second: Piece): boolean =>
	order.indexOf(first) < order.indexOf(second);

const meetsHardDropRule = (order: ReadonlyArray<Piece>): boolean =>
	comesBefore(order, Mino.J, Mino.Z) && (comesBefore(order, Mino.I, Mino.S) || comesBefore(order, Mino.L, Mino.S));

const reasonsFor = (order: ReadonlyArray<Piece>): Array<string> =>
	(plan(RELIABLE_TSD, startState(order)) ?? []).map((decision) => decision.reason);

describe("Reliable TSD", () => {
	it("loads every slide and builds every planned order into its positions", () => {
		expect(openerProblems(RELIABLE_TSD)).toEqual([]);
	});

	it("finishes every buildable order with a T-spin double worth 4 attack", () => {
		const { "no-hold": noHold, hold } = ordersByCategory(RELIABLE_TSD);
		const misses = [...noHold, ...hold].filter((order) => {
			const spin = playPlan(RELIABLE_TSD, order).find(({ placement }) => placement.mino === Mino.T);

			return spin?.lines !== 2 || spin.spin !== "normal" || spin.attack !== 4;
		});

		expect(misses).toEqual([]);
	});

	it("builds 2,744 of the 5,040 first-bag orders, swng's 54.44% cover with hold", () => {
		const { "no-hold": noHold, hold, impossible } = ordersByCategory(RELIABLE_TSD);

		expect([noHold.length, hold.length, impossible.length]).toEqual([240, 2504, 2296]);
		expect(((noHold.length + hold.length) / 5040) * 100).toBeCloseTo(54.44, 2);
	});

	it("builds every order meeting Hard Drop's rule, which holds only the T", () => {
		const { "no-hold": noHold, hold, impossible } = ordersByCategory(RELIABLE_TSD);
		const all = [...noHold, ...hold, ...impossible];
		const ruled = all.filter(meetsHardDropRule);

		expect(ruled).toHaveLength(1680);
		expect(ruled.filter((order) => categorize(RELIABLE_TSD, order) === "impossible")).toEqual([]);
		expect(noHold).toEqual(ruled.filter((order) => order.at(-1) === Mino.T));
	});

	it("slides or spins a late I and a late L under the pieces above them", () => {
		expect(reasonsFor([Mino.L, Mino.I, Mino.O, Mino.S, Mino.J, Mino.Z, Mino.T])).toContain(
			"Slide the I in from the right wall, under the L.",
		);
		expect(reasonsFor([Mino.L, Mino.J, Mino.I, Mino.O, Mino.S, Mino.Z, Mino.T])).toContain(
			"Drop the I upright into the slot, then spin it counterclockwise under the L.",
		);
		expect(reasonsFor([Mino.I, Mino.S, Mino.L, Mino.O, Mino.J, Mino.Z, Mino.T])).toContain(
			"Slide the L in from the left wall, under the S.",
		);
		expect(reasonsFor([Mino.O, Mino.I, Mino.S, Mino.L, Mino.J, Mino.Z, Mino.T])).toContain(
			"Stand the L on the I, then spin it clockwise under the S.",
		);
	});

	it("can't build the order on the possibility slide", () => {
		const queue = RELIABLE_TSD.slides.find(({ title }) => title === "Is it possible?")?.queue ?? [];

		expect(categorize(RELIABLE_TSD, queue)).toBe("impossible");
	});

	it("shows a practice mistake, retries from it and deals the next order on a clear", () => {
		const session = practice("hold");
		const first = session.state.current;

		if (first === "next-bag") throw new Error("A dealt order starts with a piece");

		session.game.input(dropSteps({ mino: first, orientation: "spawn", column: 4, row: 0 }));
		playUntilPaused(session.game);

		expect(session.status).toBe("mistake");
		expect(session.mistake?.kind).toBe("placement");

		retryMistake(session);
		session.game.input(planScript(plan(RELIABLE_TSD, session.state) ?? [], FAST));
		playUntilPaused(session.game);

		expect(session.clears).toBe(1);
		expect(session.status).toBe("playing");
	});

	it("marks an impossible call right only when the order can't be built", () => {
		const impossible = practice("impossible");
		const possible = practice("no-hold");

		declareImpossible(impossible, RELIABLE_TSD, HANDLING);
		declareImpossible(possible, RELIABLE_TSD, HANDLING);

		expect(impossible.clears).toBe(1);
		expect(possible.mistake?.kind).toBe("possible");
	});
});
