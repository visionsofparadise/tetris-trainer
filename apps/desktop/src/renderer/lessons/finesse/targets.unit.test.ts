import { Mino, type ScriptStep } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { routeRules } from "./targets";

const DAS_LEFT: ScriptStep = { das: "moveLeft" };
const CW: ScriptStep = { tap: "rotateCW" };

describe("route rules", () => {
	it("names the rules each route shows", () => {
		expect(routeRules({ mino: Mino.T, orientation: "spawn", column: 3 }, [])).toEqual(["drop"]);
		expect(routeRules({ mino: Mino.J, orientation: "right", column: 1 }, [DAS_LEFT, CW])).toEqual([
			"das",
			"gap",
			"toward-travel",
		]);
		expect(routeRules({ mino: Mino.J, orientation: "right", column: 0 }, [CW, DAS_LEFT])).toEqual(["das", "flush"]);
		expect(
			routeRules({ mino: Mino.T, orientation: "spawn", column: 6 }, [{ das: "moveRight" }, { tap: "moveLeft" }]),
		).toEqual(["das", "tap-back"]);
		expect(routeRules({ mino: Mino.T, orientation: "reverse", column: 3 }, [{ tap: "rotate180" }])).toEqual([
			"turn",
			"south",
		]);
		expect(routeRules({ mino: Mino.S, orientation: "right", column: 4 }, [CW])).toEqual(["turn", "verticals"]);
		expect(
			routeRules({ mino: Mino.T, orientation: "right", column: 2 }, [CW, { tap: "moveLeft" }, { tap: "moveLeft" }]),
		).toEqual(["taps", "any-order"]);
	});
});
