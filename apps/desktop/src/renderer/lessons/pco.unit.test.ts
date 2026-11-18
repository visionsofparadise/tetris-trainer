import { Mino, type Piece, type Placement } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { categorize } from "./opener/orders";
import { afterHold, afterPlace, judge, plan, startState } from "./opener/planner";
import { PCO } from "./pco";

const { L, I, Z, S, O, J, T } = Mino;

const I_UPRIGHT: Placement = { mino: I, orientation: "right", column: 3, row: 0 };

const placesI = (order: ReadonlyArray<Piece>): boolean =>
	(plan(PCO, startState(order)) ?? []).some(
		(decision) => decision.kind === "place" && decision.position.placement.mino === I,
	);

describe("PCO plan", () => {
	it("holds the I when it arrives", () => {
		const [first] = plan(PCO, startState([I, J, O, L, Z, T, S])) ?? [];

		expect(first).toEqual({ kind: "hold", reason: "Hold the I: the I stays in hold for the perfect clear." });
		expect(placesI([I, J, O, L, Z, T, S])).toBe(false);
	});

	it("stands the I upright when hold must keep another piece", () => {
		expect(placesI([I, O, J, L, Z, T, S])).toBe(true);
	});

	it("slides the Z under a T that is already in", () => {
		const [, tucked] = plan(PCO, startState([T, Z, J, O, L, S, I])) ?? [];

		expect(tucked).toMatchObject({ kind: "place", reason: "Slide the Z under the T's nub." });
	});

	it("finds no plan for the sources' bad bag SOZITLJ", () => {
		expect(categorize(PCO, [S, O, Z, I, T, L, J])).toBe("impossible");
	});
});

describe("PCO judge", () => {
	it("calls an upright I a hold mistake when hold can keep it", () => {
		const verdict = judge(PCO, startState([I, J, O, L, Z, T, S]), { kind: "place", placement: I_UPRIGHT });

		expect(verdict).toMatchObject({ ok: false, kind: "hold", best: { kind: "hold" } });
	});

	it("accepts an upright I when hold must keep another piece", () => {
		const order: Array<Piece> = [I, J, L, O, Z, T, S];
		const lUp = afterPlace(afterHold(startState(order)), J);

		expect(judge(PCO, startState(order), { kind: "hold" })).toMatchObject({ ok: true });
		expect(judge(PCO, lUp, { kind: "hold" })).toMatchObject({ ok: true });
		expect(judge(PCO, afterHold(lUp), { kind: "place", placement: I_UPRIGHT })).toMatchObject({ ok: true });
	});

	it("calls a hold that gives up the kept I a hold mistake", () => {
		const oUp = afterPlace(afterHold(startState([I, J, O, L, Z, T, S])), J);

		expect(judge(PCO, oUp, { kind: "hold" })).toMatchObject({
			ok: false,
			kind: "hold",
			detail: "Holding now leaves no way to keep the I in hold.",
		});
	});

	it("accepts the T before the Z", () => {
		const state = afterPlace(startState([J, T, Z, O, L, S, I]), J);

		expect(
			judge(PCO, state, { kind: "place", placement: { mino: T, orientation: "left", column: 8, row: 0 } }),
		).toMatchObject({ ok: true });
	});
});
