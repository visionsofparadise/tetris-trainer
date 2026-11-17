import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { isDasPress, playerPresses, pressesToSteps, type KeyPress } from "./inputs";
import type { GameKey } from "./script";

const HANDLING = DEFAULT_CONFIG.handling;

const WITH_180 = { allow180: true };
const WITHOUT_180 = { allow180: false };

const press = (key: GameKey, down: number, up = down + 1, source: KeyPress["source"] = "user"): KeyPress => ({
	key,
	source,
	down,
	up,
	blocked: false,
});

describe("isDasPress", () => {
	it("counts a shift held at least the DAS frames", () => {
		expect(isDasPress(press("moveLeft", 0, HANDLING.das), HANDLING)).toBe(true);
		expect(isDasPress(press("moveRight", 4, 4 + HANDLING.das - 1), HANDLING)).toBe(false);
	});

	it("leaves out keys other than shifts", () => {
		expect(isDasPress(press("rotateCW", 0, 40), HANDLING)).toBe(false);
		expect(isDasPress(press("softDrop", 0, 40), HANDLING)).toBe(false);
	});
});

describe("pressesToSteps", () => {
	it("turns the player's shifts and rotations into steps by down frame", () => {
		const presses = [
			press("rotateCW", 14),
			press("moveLeft", 0, 12),
			press("moveRight", 20),
			press("rotate180", 22),
			press("rotateCCW", 24),
		];

		expect(pressesToSteps(presses, HANDLING)).toEqual([
			{ das: "moveLeft" },
			{ tap: "rotateCW" },
			{ tap: "moveRight" },
			{ tap: "rotate180" },
			{ tap: "rotateCCW" },
		]);
	});

	it("omits drops, hold and scripted presses", () => {
		const presses = [
			press("hold", 0),
			press("moveLeft", 2, 3, "script"),
			press("softDrop", 4, 10),
			press("moveRight", 11),
			press("hardDrop", 13, 13),
		];

		expect(pressesToSteps(presses, HANDLING)).toEqual([{ tap: "moveRight" }]);
	});
});

describe("playerPresses", () => {
	it("counts the player's shift and rotation keydowns", () => {
		const presses = [
			press("moveLeft", 0, 20),
			press("rotateCW", 21),
			press("moveRight", 23),
			press("moveRight", 25, 26, "script"),
			press("softDrop", 27, 30),
			press("hold", 31),
			press("hardDrop", 32, 32),
		];

		expect(playerPresses(presses, WITH_180)).toBe(3);
	});

	it("counts two same-direction rotation taps as one with 180 bound", () => {
		const twice = [press("rotateCW", 0), press("rotateCW", 2), press("moveLeft", 4)];

		expect(playerPresses(twice, WITH_180)).toBe(2);
		expect(playerPresses(twice, WITHOUT_180)).toBe(3);
	});

	it("pairs only consecutive taps of one direction", () => {
		expect(playerPresses([press("rotateCW", 0), press("rotateCCW", 2)], WITH_180)).toBe(2);
		expect(playerPresses([press("rotateCW", 0), press("moveLeft", 2), press("rotateCW", 4)], WITH_180)).toBe(3);
		expect(playerPresses([press("rotateCCW", 0), press("rotateCCW", 2), press("rotateCCW", 4)], WITH_180)).toBe(2);
		expect(playerPresses([press("rotate180", 0), press("rotate180", 2)], WITH_180)).toBe(2);
	});
});
