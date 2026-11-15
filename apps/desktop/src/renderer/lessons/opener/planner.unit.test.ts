import { Mino, type Piece } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { TKI } from "../tki";
import { ordersByCategory } from "./orders";
import { afterHold, afterPlace, isComplete, judge, plan, startState } from "./planner";

const { L, I, Z, S, O, J, T } = Mino;

describe("plan", () => {
	it("places every piece as it comes when the order allows it", () => {
		const decisions = plan(TKI, startState([L, I, Z, S, O, J, T]), false);

		expect(decisions?.map(({ kind }) => kind)).toEqual(Array.from({ length: 7 }, () => "place"));
	});

	it("holds a piece that arrives before the piece it needs", () => {
		const [first] = plan(TKI, startState([Z, L, O, I, S, J, T])) ?? [];

		expect(first).toEqual({ kind: "hold", reason: "Hold the Z: the Z needs the I placed first." });
	});

	it("finds no plan when two pieces must wait at once", () => {
		expect(plan(TKI, startState([Z, T, L, O, I, S, J]))).toBeNull();
	});

	it("is impossible exactly when two drawn pieces would wait at the same time", () => {
		const canGo = (piece: Piece, placed: ReadonlyArray<Piece>) =>
			TKI.positions.some(
				({ placement, after }) => placement.mino === piece && after.every((needed) => placed.includes(needed)),
			);

		const twoWait = (order: ReadonlyArray<Piece>) => {
			const placed: Array<Piece> = [];
			let waiting: Array<Piece> = [];

			for (const piece of order) {
				waiting.push(piece);

				for (
					let ready = waiting.find((held) => canGo(held, placed));
					ready;
					ready = waiting.find((held) => canGo(held, placed))
				) {
					placed.push(ready);
					waiting = waiting.filter((held) => held !== ready);
				}

				if (waiting.length > 1) return true;
			}

			return false;
		};

		const orders = ordersByCategory(TKI);

		expect(orders.impossible.every(twoWait)).toBe(true);
		expect([...orders["no-hold"], ...orders.hold].some(twoWait)).toBe(false);
	});
});

describe("judge", () => {
	const state = startState([I, L, O, Z, S, J, T]);

	it("names the right position when a piece lands somewhere else", () => {
		const verdict = judge(TKI, state, {
			kind: "place",
			placement: { mino: I, orientation: "spawn", column: 0, row: 0 },
		});

		expect(verdict).toMatchObject({
			ok: false,
			kind: "placement",
			best: { kind: "place", reason: "Lay the I flat on the floor, right of the slot." },
		});
	});

	it("rejects a piece placed in its position before what it rests on", () => {
		const zFirst = startState([Z, I, L, O, S, J, T]);
		const verdict = judge(TKI, zFirst, {
			kind: "place",
			placement: { mino: Z, orientation: "spawn", column: 3, row: 1 },
		});

		expect(verdict).toMatchObject({ ok: false, kind: "order", detail: "Needs the I first." });
	});

	it("tucks the I under an S that is already in", () => {
		const sFirst = startState([S, I, L, O, Z, J, T]);
		const [, tucked] = plan(TKI, sFirst) ?? [];

		expect(tucked).toMatchObject({
			kind: "place",
			reason: "Slide the I under the S.",
		});
	});

	it("accepts the next bag's T in place of a T still in hold", () => {
		const pieces: Array<Piece> = [L, I, Z, S, O, J];
		const tHeld = pieces.reduce(
			(state, piece) => afterPlace(state, piece),
			afterHold(startState([T, L, I, Z, S, O, J])),
		);
		const verdict = judge(TKI, tHeld, {
			kind: "place",
			placement: { mino: T, orientation: "reverse", column: 1, row: 0 },
		});

		expect(verdict).toMatchObject({ ok: true });
		expect(verdict.ok && isComplete(TKI, verdict.next)).toBe(true);
	});

	it("finishes on the T without the J", () => {
		expect(plan(TKI, startState([L, I, Z, S, O, T, J]))).toHaveLength(6);
	});

	it("accepts any route that can still finish", () => {
		expect(judge(TKI, state, { kind: "hold" })).toEqual({ ok: true, next: afterHold(state) });
		expect(
			judge(TKI, state, { kind: "place", placement: { mino: I, orientation: "spawn", column: 3, row: 0 } }),
		).toEqual({ ok: true, next: afterPlace(state, I) });
	});
});
