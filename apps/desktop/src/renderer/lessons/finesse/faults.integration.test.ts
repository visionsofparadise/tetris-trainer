import { DEFAULT_CONFIG, Mino, type GameKey, type KeyPress, type Orientation } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { findFault, wrongSpot, type Attempt } from "./faults";
import type { Player } from "../drill/Drill";

const WITH_180: Player = { handling: DEFAULT_CONFIG.handling, allow180: true };
const WITHOUT_180: Player = { ...WITH_180, allow180: false };

const TAP_FRAMES = 2;
const DAS_FRAMES = 30;
const GAP = 5;

const tap = (key: GameKey, down: number): KeyPress => ({
	key,
	source: "user",
	down,
	up: down + TAP_FRAMES,
	blocked: false,
	carried: false,
});

const das = (key: GameKey, down: number, blocked = true): KeyPress => ({
	key,
	source: "user",
	down,
	up: down + DAS_FRAMES,
	blocked,
	carried: false,
});

const attempt = (
	mino: Attempt["target"]["mino"],
	target: [Orientation, number],
	presses: ReadonlyArray<KeyPress>,
	orientation: Orientation = target[0],
): Attempt => ({ target: { mino, orientation: target[0], column: target[1] }, orientation, presses });

type Key = GameKey | `das ${GameKey}`;

const pressed = (keys: ReadonlyArray<Key>): Array<KeyPress> =>
	keys.map((key, index) => {
		const down = index * (DAS_FRAMES + GAP);

		return key.startsWith("das ") ? das(key.slice(4) as GameKey, down) : tap(key as GameKey, down);
	});

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

	it("counts three taps one way across a turn, and only taps that move the piece", () => {
		const leftThrice = pressed(["moveLeft", "rotateCW", "moveLeft", "moveLeft"]);
		const kinds = ([Mino.J, Mino.T, Mino.S, Mino.Z] as const).map(
			(mino) => findFault(attempt(mino, ["right", 1], leftThrice), WITH_180)?.kind,
		);

		expect(kinds).toEqual(["three-taps", "three-taps", "three-taps", "three-taps"]);
		expect(
			findFault(
				attempt(Mino.J, ["left", 6], pressed(["moveRight", "moveRight", "rotateCCW", "moveRight"])),
				WITH_180,
			)?.kind,
		).toBe("three-taps");
		expect(
			findFault(
				attempt(Mino.I, ["spawn", 6], pressed(["das moveRight", "moveRight", "moveRight", "moveRight"])),
				WITH_180,
			)?.kind,
		).toBe("extra-press");
		expect(
			findFault(
				attempt(Mino.J, ["spawn", 0], pressed(["das moveLeft", "moveLeft", "moveLeft", "moveLeft"])),
				WITH_180,
			)?.kind,
		).toBe("extra-press");
	});

	it("names a turn before the DAS only when the player pressed a DAS", () => {
		expect(
			findFault(attempt(Mino.J, ["left", 0], pressed(["das moveRight", "das moveLeft", "rotateCCW"])), WITH_180)
				?.kind,
		).toBe("extra-press");
		expect(
			findFault(attempt(Mino.J, ["right", 1], pressed(["rotateCW", "das moveLeft", "moveRight"])), WITH_180)?.kind,
		).toBe("rotated-before-das");
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

	it("leaves a DAS carried from the previous piece out of the count", () => {
		const carried: KeyPress = { ...das("moveLeft", 0), carried: true };

		expect(findFault(attempt(Mino.T, ["right", 1], [carried, tap("rotateCW", 2)]), WITH_180)).toBeNull();
	});

	it("compares the player's keys with the nearest minimal route", () => {
		expect(
			findFault(
				attempt(Mino.T, ["spawn", 6], [tap("moveRight", 0), tap("moveRight", 5), tap("moveRight", 10)]),
				WITH_180,
			),
		).toEqual({
			kind: "three-taps",
			title: "Three taps",
			keys: {
				yours: [{ tap: "moveRight" }, { tap: "moveRight" }, { tap: "moveRight" }],
				minimal: [{ das: "moveRight" }, { tap: "moveLeft" }],
			},
		});
		expect(wrongSpot(attempt(Mino.O, ["spawn", 4], []), WITH_180)).toEqual({
			kind: "wrong-spot",
			title: "Wrong spot",
			keys: { yours: [], minimal: [] },
		});
	});
});
