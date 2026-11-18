import { describe, expect, it } from "vitest";
import { wellStage, type WellStageId } from "./stages";
import { isGoalMet, replayRound, WELLS_DRILL, type WellsState } from "./wellsDrill";

const stateOf = (id: WellStageId, lines: number, mistakes: number): WellsState => ({
	stage: wellStage(id),
	seed: 7,
	round: 2,
	opening: { board: [], queue: [], seed: 7 },
	lines,
	mistakes,
	converted: 1,
	search: null,
	passed: false,
	over: false,
});

describe("Column wells drill", () => {
	it("passes a line stage at 40 lines, with no mistake in a restart stage", () => {
		expect(isGoalMet(stateOf("nine-zero", 40, 0), false)).toBe(true);
		expect(isGoalMet(stateOf("nine-zero", 40, 1), false)).toBe(false);
		expect(isGoalMet(stateOf("nine-zero", 36, 0), true)).toBe(false);
		expect(isGoalMet(stateOf("three-side", 44, 3), false)).toBe(true);
	});

	it("passes Convert on the lock that makes the stack quad-ready", () => {
		expect(isGoalMet(stateOf("convert", 0, 2), true)).toBe(true);
		expect(isGoalMet(stateOf("convert", 8, 0), false)).toBe(false);
	});

	it("replays a round from its start with the counts cleared", () => {
		const state = { ...stateOf("six-three", 12, 1), passed: true, over: true };

		expect(replayRound(state)).toEqual({ ...state, lines: 0, mistakes: 0, passed: false, over: false });
		expect(replayRound(state).opening).toBe(state.opening);
	});

	it("reads progress as lines, or boards converted in Convert", () => {
		expect(WELLS_DRILL.progress(stateOf("eternal", 44, 0))).toEqual({ label: "Lines", value: "40 / 40" });
		expect(WELLS_DRILL.progress(stateOf("convert", 0, 0))).toEqual({ label: "Boards converted", value: "1" });
	});
});
