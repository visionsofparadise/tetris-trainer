import { DEFAULT_CONFIG, Mino, type Piece } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { openerProblems, playPlan, playUntilPaused } from "./opener/openerChecks";
import { planScript } from "./opener/openerScript";
import { categorize, ordersByCategory } from "./opener/orders";
import { plan } from "./opener/planner";
import { declareImpossible, dealPractice, initialPractice, type PracticeSession } from "./opener/practiceSession";
import { NUMBER_ONE } from "./numberOne";

const { J, I, O, L, Z, S, T } = Mino;

const FAST = { keyWait: 0, decisionWait: 0 };
const HANDLING = { ...DEFAULT_CONFIG.handling, sdf: 41 };

const SUPPORTS: Partial<Record<Piece, ReadonlyArray<Piece>>> = {
	[I]: [J],
	[L]: [O],
	[Z]: [O],
	[S]: [Z],
	[T]: [J, I, O, L, Z, S],
};

const comesBefore = (order: ReadonlyArray<Piece>, first: Piece, second: Piece): boolean =>
	order.indexOf(first) < order.indexOf(second);

const sourcePairs = (order: ReadonlyArray<Piece>): boolean =>
	comesBefore(order, O, L) && comesBefore(order, Z, S) && comesBefore(order, J, I);

const twoWait = (order: ReadonlyArray<Piece>): boolean => {
	const placed: Array<Piece> = [];
	let waiting: Array<Piece> = [];
	const isReady = (piece: Piece) => (SUPPORTS[piece] ?? []).every((support) => placed.includes(support));

	for (const piece of order) {
		waiting.push(piece);

		for (let ready = waiting.find(isReady); ready; ready = waiting.find(isReady)) {
			placed.push(ready);
			waiting = waiting.filter((held) => held !== ready);
		}

		if (waiting.length > 1) return true;
	}

	return false;
};

const joined = (orders: ReadonlyArray<ReadonlyArray<Piece>>): Array<string> =>
	orders.map((order) => order.join("")).sort();

const practice = (filter: PracticeSession["filter"]): PracticeSession => {
	const session = initialPractice(NUMBER_ONE, HANDLING);

	session.filter = filter;
	dealPractice(session, NUMBER_ONE, HANDLING);
	session.game.resume();

	return session;
};

describe("Number One", () => {
	it("loads every slide and builds every planned order into its positions", () => {
		expect(openerProblems(NUMBER_ONE)).toEqual([]);
	});

	it("finishes every buildable order with a T-spin double worth 4 attack", () => {
		const { "no-hold": noHold, hold } = ordersByCategory(NUMBER_ONE);
		const misses = [...noHold, ...hold].filter((order) => {
			const spin = playPlan(NUMBER_ONE, order).find(({ placement }) => placement.mino === T);

			return spin?.lines !== 2 || spin.spin !== "normal" || spin.attack !== 4;
		});

		expect(misses).toEqual([]);
	});

	it("builds without hold exactly when the source's pairs hold, the O precedes the Z and the T comes last", () => {
		const { "no-hold": noHold, hold, impossible } = ordersByCategory(NUMBER_ONE);
		const all = [...noHold, ...hold, ...impossible];
		const ruled = all.filter((order) => sourcePairs(order) && comesBefore(order, O, Z) && order.at(-1) === T);

		expect(all.filter(sourcePairs)).toHaveLength(630);
		expect(joined(noHold)).toEqual(joined(ruled));
		expect(noHold).toHaveLength(45);
	});

	it("is impossible exactly when two drawn pieces would wait at the same time", () => {
		const { "no-hold": noHold, hold, impossible } = ordersByCategory(NUMBER_ONE);

		expect(joined(impossible)).toEqual(joined([...noHold, ...hold, ...impossible].filter(twoWait)));
		expect([noHold.length, hold.length, impossible.length]).toEqual([45, 803, 4192]);
	});

	it("shows an impossible order on the slide that asks whether it is possible", () => {
		const queues = NUMBER_ONE.slides.flatMap(({ queue }) => (queue ? [queue] : []));

		expect(queues.map((queue) => categorize(NUMBER_ONE, queue))).toEqual(["impossible"]);
	});

	it("plays a dealt hold order to a clear and marks an impossible call right only when the order can't be built", () => {
		const session = practice("hold");

		session.game.input(planScript(plan(NUMBER_ONE, session.state) ?? [], FAST));
		playUntilPaused(session.game);

		const impossible = practice("impossible");
		const possible = practice("no-hold");

		declareImpossible(impossible, NUMBER_ONE, HANDLING);
		declareImpossible(possible, NUMBER_ONE, HANDLING);

		expect(session.clears).toBe(1);
		expect(impossible.clears).toBe(1);
		expect(possible.mistake?.kind).toBe("possible");
	});
});
