import { describe, expect, it } from "vitest";
import { nearestRoute } from "./faults";
import type { ScriptStep } from "@tetris-trainer/game";

const L: ScriptStep = { tap: "moveLeft" };
const R: ScriptStep = { tap: "moveRight" };
const DL: ScriptStep = { das: "moveLeft" };
const DR: ScriptStep = { das: "moveRight" };
const CW: ScriptStep = { tap: "rotateCW" };
const CCW: ScriptStep = { tap: "rotateCCW" };

describe("nearestRoute", () => {
	it("takes the route with the fewest edits, first in tie order", () => {
		const routes = [
			[CW, DR, L],
			[DR, L, CW],
		];

		expect(nearestRoute(routes, [DR, L, CW, R])).toEqual(routes[1]);
		expect(nearestRoute(routes, [DR])).toEqual(routes[0]);
	});

	it("prefers the route whose turns match the player's on a tie", () => {
		const routes = [
			[CW, DL],
			[CCW, DL],
		];

		expect(nearestRoute(routes, [DL, L, CCW])).toEqual(routes[1]);
		expect(nearestRoute(routes, [DL, L, CW])).toEqual(routes[0]);
	});
});
