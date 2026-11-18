import { DEFAULT_CONFIG, dropSteps, Mino, type Piece } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { openerProblems, playPlan, playUntilPaused } from "./opener/openerChecks";
import { planScript } from "./opener/openerScript";
import { categorize, ordersByCategory } from "./opener/orders";
import { plan } from "./opener/planner";
import {
	declareImpossible,
	dealPractice,
	initialPractice,
	retryMistake,
	type PracticeSession,
} from "./opener/practiceSession";
import { PELICAN } from "./pelican";

const FAST = { keyWait: 0, decisionWait: 0 };
const HANDLING = { ...DEFAULT_CONFIG.handling, sdf: 41 };

const practice = (filter: PracticeSession["filter"]): PracticeSession => {
	const session = initialPractice(PELICAN, HANDLING);

	session.filter = filter;
	dealPractice(session, PELICAN, HANDLING);
	session.game.resume();

	return session;
};

const allOrders = (): Array<Array<Piece>> => {
	const { "no-hold": noHold, hold, impossible } = ordersByCategory(PELICAN);

	return [...noHold, ...hold, ...impossible];
};

const isBuildable = (order: ReadonlyArray<Piece>): boolean => categorize(PELICAN, order) !== "impossible";

const before = (order: ReadonlyArray<Piece>, first: Piece, second: Piece): boolean =>
	order.indexOf(first) < order.indexOf(second);

const isJEarly = (order: ReadonlyArray<Piece>): boolean =>
	before(order, Mino.J, Mino.L) && before(order, Mino.J, Mino.O);

const count = (orders: ReadonlyArray<ReadonlyArray<Piece>>, test: (order: ReadonlyArray<Piece>) => boolean): number =>
	orders.filter(test).length;

describe("Pelican", () => {
	it("loads every slide and builds every planned order into its positions", () => {
		expect(openerProblems(PELICAN)).toEqual([]);
	});

	it("finishes every buildable order with a T-spin double worth 4 attack", () => {
		const { "no-hold": noHold, hold } = ordersByCategory(PELICAN);
		const misses = [...noHold, ...hold].filter((order) => {
			const spin = playPlan(PELICAN, order).find(({ placement }) => placement.mino === Mino.T);

			return spin?.lines !== 2 || spin.spin !== "normal" || spin.attack !== 4;
		});

		expect(misses).toEqual([]);
	});

	it("sorts the 5,040 first-bag orders into 120 no-hold, 1,504 hold and 3,416 impossible", () => {
		const { "no-hold": noHold, hold, impossible } = ordersByCategory(PELICAN);

		expect([noHold.length, hold.length, impossible.length]).toEqual([120, 1504, 3416]);
	});

	it("builds every order of the source's rule: an S start with the J before the L and O", () => {
		const orders = allOrders().filter((order) => order[0] === Mino.S && isJEarly(order));

		expect([orders.length, count(orders, isBuildable)]).toEqual([240, 240]);
	});

	it("builds every order where only the T has to wait", () => {
		const orders = allOrders().filter((order) => before(order, Mino.S, Mino.Z) && isJEarly(order));

		expect([orders.length, count(orders, isBuildable)]).toEqual([840, 840]);
	});

	it("rejects the S start and early-J rule read as either one alone", () => {
		const orders = allOrders();
		const isRule = (order: ReadonlyArray<Piece>): boolean => order[0] === Mino.S || isJEarly(order);

		expect({
			rule: count(orders, isRule),
			agree: count(orders, (order) => isRule(order) === isBuildable(order)),
			ruleOnly: count(orders, (order) => isRule(order) && !isBuildable(order)),
			holdOnly: count(orders, (order) => !isRule(order) && isBuildable(order)),
		}).toEqual({ rule: 2160, agree: 3736, ruleOnly: 920, holdOnly: 384 });
	});

	it("deals an impossible queue on the possibility slide", () => {
		const queues = PELICAN.slides.flatMap(({ queue }) => (queue ? [queue] : []));

		expect(queues.map((queue) => categorize(PELICAN, queue))).toEqual(["impossible"]);
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

		retryMistake(session);
		session.game.input(planScript(plan(PELICAN, session.state) ?? [], FAST));
		playUntilPaused(session.game);

		expect(session.clears).toBe(1);
		expect(session.status).toBe("playing");
	});

	it("marks an impossible call right only when the order can't be built", () => {
		const impossible = practice("impossible");
		const possible = practice("no-hold");

		declareImpossible(impossible, PELICAN, HANDLING);
		declareImpossible(possible, PELICAN, HANDLING);

		expect(impossible.clears).toBe(1);
		expect(possible.mistake?.kind).toBe("possible");
	});
});
