import { DEFAULT_CONFIG, DEMO_HANDLING, dropSteps, Mino, placementCells, type Piece } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { openerProblems, playUntilPaused } from "./opener/openerChecks";
import { loadOrder, planScript } from "./opener/openerScript";
import { ordersByCategory } from "./opener/orders";
import { plan, startState } from "./opener/planner";
import {
	declareImpossible,
	dealPractice,
	initialPractice,
	retryMistake,
	type PracticeSession,
} from "./opener/practiceSession";
import { PCO } from "./pco";

const { L, I, Z, S, O, J, T } = Mino;

const FAST = { keyWait: 0, decisionWait: 0 };
const HANDLING = { ...DEFAULT_CONFIG.handling, sdf: 41 };

const practice = (filter: PracticeSession["filter"]): PracticeSession => {
	const session = initialPractice(PCO, HANDLING);

	session.filter = filter;
	dealPractice(session, PCO, HANDLING);
	session.game.resume();

	return session;
};

const placesI = (order: ReadonlyArray<Piece>): boolean =>
	(plan(PCO, startState(order)) ?? []).some(
		(decision) => decision.kind === "place" && decision.position.placement.mino === I,
	);

const cellKeys = (cells: ReadonlyArray<readonly [number, number]>): Array<string> =>
	cells.map(([x, y]) => `${x},${y}`).sort();

describe("PCO", () => {
	it("loads every slide and builds every planned order into its positions", () => {
		expect(openerProblems(PCO)).toEqual([]);
	});

	it("splits the 5,040 first-bag orders into 2,520 buildable, 1,064 of them with the I kept in hold", () => {
		const { "no-hold": noHold, hold, impossible } = ordersByCategory(PCO);
		const buildable = [...noHold, ...hold];

		expect({
			noHold: noHold.length,
			hold: hold.length,
			impossible: impossible.length,
			kept: buildable.filter((order) => !placesI(order)).length,
		}).toEqual({ noHold: 60, hold: 2460, impossible: 2520, kept: 1064 });
	});

	it("finishes with the rectangle and trapezoid on the board and the I in hold", () => {
		const order: Array<Piece> = [Z, I, T, J, O, L, S];
		const decisions = plan(PCO, startState(order)) ?? [];
		const game = loadOrder(DEMO_HANDLING, order);
		let places = 0;

		game.on("place", () => {
			places++;

			if (places === 6) game.pause();
		});
		game.input(planScript(decisions, FAST));
		playUntilPaused(game);

		const shape = PCO.positions.filter(({ placement }) => placement.mino !== I);
		const filled = game.board.flatMap((row, y) =>
			row.flatMap((cell, x): Array<[number, number]> => (cell === null ? [] : [[x, y]])),
		);

		expect(game.hold).toBe(I);
		expect(cellKeys(filled)).toEqual(cellKeys(shape.flatMap(({ placement }) => placementCells(placement))));
	});

	it("shows a practice mistake, retries from it and deals the next order on a clear", () => {
		const session = practice("hold");
		const first = session.state.current;

		if (first === "next-bag") throw new Error("A dealt order starts with a piece");

		session.game.input(dropSteps({ mino: first, orientation: "spawn", column: 4, row: 0 }));
		playUntilPaused(session.game);

		expect(session.status).toBe("mistake");
		expect(session.mistake?.best).not.toBeNull();

		retryMistake(session);
		session.game.input(planScript(plan(PCO, session.state) ?? [], FAST));
		playUntilPaused(session.game);

		expect(session.clears).toBe(1);
		expect(session.status).toBe("playing");
	});

	it("marks an impossible call right only when the order can't be built", () => {
		const impossible = practice("impossible");
		const possible = practice("no-hold");

		declareImpossible(impossible, PCO, HANDLING);
		declareImpossible(possible, PCO, HANDLING);

		expect(impossible.clears).toBe(1);
		expect(possible.mistake?.kind).toBe("possible");
	});
});
