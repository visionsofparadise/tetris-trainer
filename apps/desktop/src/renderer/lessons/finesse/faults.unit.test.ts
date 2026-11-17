import {
	DEFAULT_CONFIG,
	finesseRoutes,
	Mino,
	type GameKey,
	type KeyPress,
	type Orientation,
} from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { findFault, keysText, nearestRoute, wrongSpot, type Attempt } from "./faults";
import type { Player } from "../drill/Drill";

const WITH_180: Player = { handling: DEFAULT_CONFIG.handling, allow180: true };
const WITHOUT_180: Player = { ...WITH_180, allow180: false };

const TAP_FRAMES = 2;
const DAS_FRAMES = 30;

const tap = (key: GameKey, down: number): KeyPress => ({
	key,
	source: "user",
	down,
	up: down + TAP_FRAMES,
	blocked: false,
});

const das = (key: GameKey, down: number, blocked = true): KeyPress => ({
	key,
	source: "user",
	down,
	up: down + DAS_FRAMES,
	blocked,
});

const attempt = (
	mino: Attempt["target"]["mino"],
	target: [Orientation, number],
	presses: ReadonlyArray<KeyPress>,
	orientation: Orientation = target[0],
): Attempt => ({ target: { mino, orientation: target[0], column: target[1] }, orientation, presses });

describe("finesse faults", () => {
	it("passes a minimal route with every DAS run to the wall", () => {
		expect(findFault(attempt(Mino.T, ["spawn", 0], [das("moveLeft", 0)]), WITH_180)).toBeNull();
		expect(findFault(attempt(Mino.J, ["right", 1], [das("moveLeft", 0), tap("rotateCW", 40)]), WITH_180)).toBeNull();
	});

	it("names each fault kind by the first rule that matches", () => {
		const kinds = [
			attempt(Mino.T, ["spawn", 1], [das("moveLeft", 0, false)]),
			attempt(Mino.O, ["spawn", 4], [tap("rotateCW", 0)], "right"),
			attempt(Mino.T, ["spawn", 0], [tap("moveLeft", 0), tap("moveLeft", 5), tap("moveLeft", 10)]),
			attempt(Mino.T, ["spawn", 6], [tap("moveRight", 0), tap("moveRight", 5), tap("moveRight", 10)]),
			attempt(Mino.J, ["right", 1], [tap("rotateCW", 0), das("moveLeft", 5), tap("moveRight", 40)]),
			attempt(Mino.O, ["spawn", 0], [das("moveLeft", 0), tap("moveLeft", 40)]),
		].map((tried) => findFault(tried, WITH_180)?.kind);

		expect(kinds).toEqual([
			"partial-das",
			"wrong-rotation",
			"tapped-across",
			"three-taps",
			"rotated-before-das",
			"extra-press",
		]);
	});

	it("calls the long way round and the other vertical state wrong rotations", () => {
		const longWay = attempt(Mino.T, ["right", 4], [tap("rotateCCW", 0), tap("rotateCCW", 5), tap("rotateCCW", 10)]);
		const otherVertical = attempt(
			Mino.S,
			["right", 1],
			[tap("rotateCCW", 0), das("moveLeft", 5), tap("moveRight", 40)],
			"left",
		);

		expect(findFault(longWay, WITH_180)?.kind).toBe("wrong-rotation");
		expect(findFault(otherVertical, WITH_180)?.kind).toBe("wrong-rotation");
	});

	it("counts two same-direction turns as one press when a 180 is bound", () => {
		const twoTurns = attempt(Mino.T, ["reverse", 0], [tap("rotateCW", 0), tap("rotateCW", 5), das("moveLeft", 10)]);
		const threeTurns = attempt(
			Mino.T,
			["reverse", 0],
			[tap("rotateCW", 0), tap("rotateCW", 5), tap("rotateCW", 10), tap("rotateCCW", 15), das("moveLeft", 20)],
		);

		expect(findFault(twoTurns, WITH_180)).toBeNull();
		expect(findFault(twoTurns, WITHOUT_180)).toBeNull();
		expect(findFault(threeTurns, WITH_180)?.kind).toBe("wrong-rotation");
	});

	it("compares the keys against the nearest minimal route, first in tie order", () => {
		const routes = finesseRoutes({ mino: Mino.T, orientation: "right", column: 7 }, WITH_180);

		expect(nearestRoute(routes, [{ das: "moveRight" }, { tap: "moveLeft" }, { tap: "rotateCW" }])).toEqual(routes[1]);
		expect(nearestRoute(routes, [{ das: "moveRight" }])).toEqual(routes[0]);
		expect(keysText(routes[0] ?? [])).toBe("CW, DAS →, ←");
	});

	it("writes the card's key comparison", () => {
		const fault = findFault(
			attempt(Mino.T, ["spawn", 6], [tap("moveRight", 0), tap("moveRight", 5), tap("moveRight", 10)]),
			WITH_180,
		);

		expect(fault).toEqual({
			kind: "three-taps",
			title: "Three taps",
			detail: "Your keys: →, →, →\nMinimal: DAS →, ←",
		});
		expect(wrongSpot(attempt(Mino.O, ["spawn", 4], []), WITH_180)).toEqual({
			kind: "wrong-spot",
			title: "Wrong spot",
			detail: "Your keys: none\nMinimal: none",
		});
	});
});
