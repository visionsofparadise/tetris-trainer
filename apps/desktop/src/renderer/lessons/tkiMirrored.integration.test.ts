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
import { TKI } from "./tki";
import { TKI_MIRRORED } from "./tkiMirrored";
import type { Opener } from "./opener/Opener";

const { L, I, Z, S, J, T } = Mino;
const FAST = { keyWait: 0, decisionWait: 0 };
const HANDLING = { ...DEFAULT_CONFIG.handling, sdf: 41 };
const MIRRORED_PIECE: Partial<Record<Piece, Piece>> = { [J]: L, [L]: J, [S]: Z, [Z]: S };

const mirrorOrder = (order: ReadonlyArray<Piece>): Array<Piece> => order.map((piece) => MIRRORED_PIECE[piece] ?? piece);

const before = (order: ReadonlyArray<Piece>, first: Piece, second: Piece): boolean =>
	order.indexOf(first) < order.indexOf(second);

const hardDropOnly: Opener = {
	...TKI_MIRRORED,
	optional: [],
	positions: TKI_MIRRORED.positions.flatMap((position) => {
		const { mino, orientation } = position.placement;

		if (mino === I) return [{ ...position, before: [Z] }];

		return mino === L && orientation !== "reverse" ? [] : [position];
	}),
};

const buildsHoldingOnlyT = (order: ReadonlyArray<Piece>): boolean =>
	plan(hardDropOnly, startState([...order.filter((piece) => piece !== T), T]), false) !== null;

const practice = (filter: PracticeSession["filter"]): PracticeSession => {
	const session = initialPractice(TKI_MIRRORED, HANDLING);

	session.filter = filter;
	dealPractice(session, TKI_MIRRORED, HANDLING);
	session.game.resume();

	return session;
};

describe("TKI mirrored", () => {
	it("loads every slide and builds every planned order into its positions", () => {
		expect(openerProblems(TKI_MIRRORED)).toEqual([]);
	});

	it("finishes every buildable order with a T-spin double worth 4 attack", () => {
		const { "no-hold": noHold, hold } = ordersByCategory(TKI_MIRRORED);
		const misses = [...noHold, ...hold].filter((order) => {
			const spin = playPlan(TKI_MIRRORED, order).find(({ placement }) => placement.mino === T);

			return spin?.lines !== 2 || spin.spin !== "normal" || spin.attack !== 4;
		});

		expect(misses).toEqual([]);
	});

	it("puts every order in the category of its mirror image under TKI-3", () => {
		const { "no-hold": noHold, hold, impossible } = ordersByCategory(TKI);
		const mismatches = [...noHold, ...hold, ...impossible].filter(
			(order) => categorize(TKI_MIRRORED, mirrorOrder(order)) !== categorize(TKI, order),
		);

		expect(mismatches).toEqual([]);
	});

	it("builds with hard drops and a held T exactly when the I comes before the Z and the I before the S before the L", () => {
		const { "no-hold": noHold, hold, impossible } = ordersByCategory(TKI_MIRRORED);
		const disagreements = [...noHold, ...hold, ...impossible].filter(
			(order) => buildsHoldingOnlyT(order) !== (before(order, I, Z) && before(order, I, S) && before(order, S, L)),
		);

		expect(disagreements).toEqual([]);
	});

	it("can build every order the hard-drop rule allows", () => {
		const { impossible } = ordersByCategory(TKI_MIRRORED);

		expect(impossible.filter(buildsHoldingOnlyT)).toEqual([]);
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
		session.game.input(planScript(plan(TKI_MIRRORED, session.state) ?? [], FAST));
		playUntilPaused(session.game);

		expect(session.clears).toBe(1);
		expect(session.status).toBe("playing");
	});

	it("marks an impossible call right only when the order can't be built", () => {
		const impossible = practice("impossible");
		const possible = practice("no-hold");

		declareImpossible(impossible, TKI_MIRRORED, HANDLING);
		declareImpossible(possible, TKI_MIRRORED, HANDLING);

		expect(impossible.clears).toBe(1);
		expect(possible.mistake?.kind).toBe("possible");
	});
});
