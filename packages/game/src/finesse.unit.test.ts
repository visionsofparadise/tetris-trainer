import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import {
	finesseRoutes,
	finesseSteps,
	finesseTargets,
	minimalPresses,
	pressesReach,
	stepsMoved,
	type PieceTarget,
} from "./finesse";
import { placementCells } from "./pieces";
import { ROTATION_KEYS, type GameKey, type ScriptStep } from "./script";
import type { KeyPress } from "./inputs";

const WITH_180 = { allow180: true };
const WITHOUT_180 = { allow180: false };

const L: ScriptStep = { tap: "moveLeft" };
const R: ScriptStep = { tap: "moveRight" };
const DL: ScriptStep = { das: "moveLeft" };
const DR: ScriptStep = { das: "moveRight" };
const CW: ScriptStep = { tap: "rotateCW" };
const CCW: ScriptStep = { tap: "rotateCCW" };
const HALF: ScriptStep = { tap: "rotate180" };

const targetName = ({ mino, orientation, column }: PieceTarget): string => `${mino} ${orientation} ${column}`;

const isRotation = (step: ScriptStep | undefined): boolean =>
	step !== undefined && "tap" in step && ROTATION_KEYS.includes(step.tap);

const rotatesThenShifts = (route: ReadonlyArray<ScriptStep>): boolean =>
	route.slice(isRotation(route[0]) ? 1 : 0).every((step) => !isRotation(step));

const CHANGED: ReadonlyArray<[string, ReadonlyArray<ScriptStep>]> = [
	["i right 1", [DL, CCW]],
	["i right 2", [DL, CW]],
	["i right 7", [DR, CCW]],
	["i right 8", [DR, CW]],
	["t right 1", [DL, CW]],
	["t left 6", [DR, L, CCW]],
	["t left 7", [DR, CCW]],
	["j right 1", [DL, CW]],
	["j left 6", [DR, L, CCW]],
	["j left 7", [DR, CCW]],
	["l right 1", [DL, CW]],
	["l left 6", [DR, L, CCW]],
	["l left 7", [DR, CCW]],
	["s right 1", [DL, CW]],
	["s right 7", [DR, CCW]],
	["z right 1", [DL, CW]],
	["z right 7", [DR, CCW]],
];

describe("finesseSteps", () => {
	it("taps when the target is near the spawn column", () => {
		expect(finesseSteps({ mino: Mino.T, orientation: "spawn", column: 2 })).toEqual([{ tap: "moveLeft" }]);
	});

	it("uses DAS to reach the wall and taps back from it", () => {
		expect(finesseSteps({ mino: Mino.T, orientation: "spawn", column: 6 })).toEqual([
			{ das: "moveRight" },
			{ tap: "moveLeft" },
		]);
	});

	it("rotates first so DAS stops against the rotated piece's edge", () => {
		expect(finesseSteps({ mino: Mino.I, orientation: "right", column: 9 })).toEqual([
			{ tap: "rotateCW" },
			{ das: "moveRight" },
		]);
	});

	it("picks whichever equivalent orientation needs fewer keys", () => {
		expect(finesseSteps({ mino: Mino.S, orientation: "left", column: 0 })).toEqual([
			{ tap: "rotateCW" },
			{ das: "moveLeft" },
		]);
	});

	it("changes the route only on the 17 targets where rotating then shifting is longer", () => {
		const changed = finesseTargets().filter((target) => !rotatesThenShifts(finesseSteps(target)));

		expect(changed.map((target) => [targetName(target), finesseSteps(target)])).toEqual(CHANGED);
	});
});

describe("finesseTargets", () => {
	it("lists the 162 distinct empty-board targets", () => {
		const counts = Object.fromEntries(
			[Mino.O, Mino.I, Mino.T, Mino.J, Mino.L, Mino.S, Mino.Z].map((mino) => [
				mino,
				finesseTargets().filter((target) => target.mino === mino).length,
			]),
		);

		expect(finesseTargets()).toHaveLength(162);
		expect(counts).toEqual({ o: 9, i: 17, t: 34, j: 34, l: 34, s: 17, z: 17 });
	});
});

describe("finesseRoutes", () => {
	it("needs 0 to 3 presses with 180 bound", () => {
		const counts = [0, 1, 2, 3].map(
			(presses) => finesseTargets().filter((target) => minimalPresses(target, WITH_180) === presses).length,
		);

		expect(counts).toEqual([7, 43, 83, 29]);
	});

	it("gives O at column 2 one route", () => {
		expect(finesseRoutes({ mino: Mino.O, orientation: "spawn", column: 2 }, WITH_180)).toEqual([[L, L]]);
	});

	it("gives T spawn at column 1 two routes", () => {
		expect(finesseRoutes({ mino: Mino.T, orientation: "spawn", column: 1 }, WITH_180)).toEqual([
			[L, L],
			[DL, R],
		]);
	});

	it("reaches T right at column 1 by DAS left then CW", () => {
		expect(finesseRoutes({ mino: Mino.T, orientation: "right", column: 1 }, WITH_180)).toEqual([[DL, CW]]);
	});

	it("reaches the Z at (6,0) (6,1) (7,1) (7,2) with a rotation between taps", () => {
		const cells = "6,0 6,1 7,1 7,2";
		const target = finesseTargets().find(
			(candidate) =>
				candidate.mino === Mino.Z &&
				placementCells({ ...candidate, row: 0 })
					.map(([x, y]) => `${x},${y}`)
					.sort()
					.join(" ") === cells,
		);

		expect(target).toBeDefined();
		expect(target && finesseRoutes(target, WITH_180)).toContainEqual([R, CW, R]);
	});

	it("reaches every South by 180 then the North shift with 180 bound", () => {
		const souths = finesseTargets().filter(({ orientation }) => orientation === "reverse");

		expect(souths).toHaveLength(24);

		for (const south of souths)
			expect(finesseRoutes(south, WITH_180)[0]).toEqual([
				HALF,
				...(finesseRoutes({ ...south, orientation: "spawn" }, WITH_180)[0] ?? []),
			]);
	});

	it("turns twice before shifting to T South at column 0 without 180", () => {
		expect(finesseRoutes({ mino: Mino.T, orientation: "reverse", column: 0 }, WITHOUT_180)[0]).toEqual([CW, CW, DL]);
		expect(minimalPresses({ mino: Mino.T, orientation: "reverse", column: 0 }, WITHOUT_180)).toBe(3);
	});

	it.each([Mino.S, Mino.Z, Mino.I])("lands %s vertical by CW one column right of CCW", (mino) => {
		const verticals = finesseTargets().filter((target) => target.mino === mino && target.orientation === "right");
		const byRoute = (step: ScriptStep): Array<number> =>
			verticals
				.filter((target) => JSON.stringify(finesseRoutes(target, WITH_180)) === JSON.stringify([[step]]))
				.map(({ column }) => column);
		const [clockwise] = byRoute(CW);
		const [counterClockwise] = byRoute(CCW);

		expect(clockwise).toBeDefined();
		expect(clockwise).toBe((counterClockwise ?? Number.NaN) + 1);
	});

	it("replays steps from spawn and reports which ones moved the piece", () => {
		expect(stepsMoved(Mino.J, [DL, L, CW, L, L])).toEqual([true, false, true, true, false]);
		expect(stepsMoved(Mino.O, [CW, DR, R])).toEqual([false, true, false]);
	});
});

describe("pressesReach", () => {
	const T_RIGHT_0: PieceTarget = { mino: Mino.T, orientation: "right", column: 0 };

	const held = (key: GameKey, down: number, up: number): KeyPress => ({
		key,
		source: "user",
		down,
		up,
		blocked: true,
		carried: false,
	});

	it("replays the player's shifts and turns on an empty 0G board", () => {
		const reach = (presses: ReadonlyArray<KeyPress>): boolean =>
			pressesReach(T_RIGHT_0, presses, DEFAULT_CONFIG.handling);

		expect(reach([held("rotateCW", 0, 2), held("moveLeft", 10, 40)])).toBe(true);
		expect(reach([held("moveLeft", 0, 30), held("rotateCW", 40, 42)])).toBe(false);
		expect(reach([held("moveLeft", 0, 60), held("rotateCW", 40, 42)])).toBe(true);
		expect(reach([held("softDrop", 0, 60), held("rotateCW", 70, 72), held("moveLeft", 80, 110)])).toBe(true);
	});
});
