import { Mino, type PlaceEvent, type Piece } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { clearName, isDifficult } from "./clearName";

const lock = (mino: Piece, lines: number, spin: PlaceEvent["spin"], isPerfectClear = false) => ({
	placement: { mino, orientation: "spawn", column: 0, row: 0 } as const,
	lines,
	spin,
	isPerfectClear,
});

describe("clearName", () => {
	it("names line clears the way TETR.IO does", () => {
		expect(clearName(lock(Mino.I, 4, "none"))).toBe("Quad");
		expect(clearName(lock(Mino.L, 1, "none"))).toBe("Single");
	});

	it("names spins with their piece and mini status", () => {
		expect(clearName(lock(Mino.T, 2, "normal"))).toBe("T-spin double");
		expect(clearName(lock(Mino.S, 1, "mini"))).toBe("S-spin mini single");
		expect(clearName(lock(Mino.T, 0, "normal"))).toBe("T-spin");
	});

	it("adds a perfect clear", () => {
		expect(clearName(lock(Mino.I, 4, "none", true))).toBe("Quad · Perfect clear");
	});
});

describe("isDifficult", () => {
	it("counts quads and spin clears toward back-to-back", () => {
		expect(isDifficult(lock(Mino.I, 4, "none"))).toBe(true);
		expect(isDifficult(lock(Mino.T, 2, "normal"))).toBe(true);
		expect(isDifficult(lock(Mino.L, 3, "none"))).toBe(false);
		expect(isDifficult(lock(Mino.T, 0, "normal"))).toBe(false);
	});
});
