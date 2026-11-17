import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { kickTests } from "./kicks";

describe("kickTests", () => {
	it("turns SRS+ y-down offsets upward for J, L, S, T and Z", () => {
		expect(kickTests(Mino.T, 0, 1)).toEqual([
			[-1, 0],
			[-1, 1],
			[0, -2],
			[-1, -2],
		]);
	});

	it("reads the I's own table, including its single 180 test", () => {
		expect(kickTests(Mino.I, 0, 1)).toEqual([
			[1, 0],
			[-2, 0],
			[-2, -1],
			[1, 2],
		]);
		expect(kickTests(Mino.I, 0, 2)).toEqual([[0, 1]]);
	});

	it("gives the 180 tests for the other pieces", () => {
		expect(kickTests(Mino.S, 1, 3)).toEqual([
			[1, 0],
			[1, 2],
			[1, 1],
			[0, 2],
			[0, 1],
		]);
	});
});
