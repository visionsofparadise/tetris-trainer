import { Mino, type Piece } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import {
	currentPiece,
	FINESSE_DRILL,
	FINESSE_STAGES,
	isFinessePassed,
	startFinesse,
	type FinesseStageId,
	type FinesseState,
} from "./finesseDrill";
import { FINESSE_PIECES } from "./targets";

const SEED = 20261117;

const results = (mino: Piece, outcomes: string): FinesseState["results"] =>
	[...outcomes].map((outcome) => ({ mino, ok: outcome === "+" }));

const passes = (count: number): string => "+".repeat(count);

const stateOf = (stage: FinesseStageId, recorded: FinesseState["results"]): FinesseState => ({
	...startFinesse(stage, SEED),
	results: recorded,
});

describe("finesse drill", () => {
	it("unlocks the next piece after 20 spots in a row and resets the streak on a miss", () => {
		expect(currentPiece(stateOf("cells", results(Mino.O, passes(19))))).toBe(Mino.O);
		expect(currentPiece(stateOf("cells", results(Mino.O, passes(20))))).toBe(Mino.I);
		expect(currentPiece(stateOf("cells", results(Mino.O, `${passes(19)}-${passes(19)}`)))).toBe(Mino.O);
		expect(FINESSE_DRILL.progress(stateOf("cells", results(Mino.O, `${passes(5)}-${passes(3)}`)))).toEqual({
			label: "Progress · O",
			value: "3 in a row",
		});
	});

	it("passes the per-piece stages when the Z is done", () => {
		const unlocked = stateOf("cells", results(Mino.O, passes(20)));
		const allDone = stateOf(
			"cells",
			FINESSE_PIECES.flatMap((mino) => results(mino, passes(20))),
		);

		expect(isFinessePassed(unlocked)).toBe(false);
		expect(isFinessePassed(allDone)).toBe(true);
	});

	it("unlocks by the last 50 results in the keys stage", () => {
		expect(currentPiece(stateOf("keys", results(Mino.O, `--${passes(48)}`)))).toBe(Mino.I);
		expect(currentPiece(stateOf("keys", results(Mino.O, `---${passes(47)}`)))).toBe(Mino.O);
		expect(currentPiece(stateOf("keys", results(Mino.O, `---${passes(49)}`)))).toBe(Mino.I);
		expect(currentPiece(stateOf("keys", results(Mino.O, passes(49))))).toBe(Mino.O);
		expect(FINESSE_DRILL.progress(stateOf("keys", results(Mino.O, `-${passes(11)}`)))).toEqual({
			label: "Progress · O",
			value: "11 of the last 12",
		});
	});

	it("passes the mixed stages on 95 of the last 100", () => {
		const recorded = (misses: number) => results(Mino.T, `${"-".repeat(misses)}${passes(100 - misses)}`);

		expect(isFinessePassed(stateOf("mixed", recorded(5)))).toBe(true);
		expect(isFinessePassed(stateOf("gravity", recorded(6)))).toBe(false);
		expect(isFinessePassed(stateOf("mixed", results(Mino.T, passes(99))))).toBe(false);
		expect(FINESSE_DRILL.progress(stateOf("mixed", recorded(6)))).toEqual({
			label: "Progress",
			value: "94 of the last 100",
		});
	});

	it("passes the reset run on 40 in a row and starts it over from nothing", () => {
		const reset = FINESSE_STAGES.find(({ id }) => id === "reset");

		if (!reset) throw new Error("The reset stage is missing");

		expect(reset.onMistake).toBe("restart");
		expect(isFinessePassed(stateOf("reset", results(Mino.T, passes(40))))).toBe(true);
		expect(isFinessePassed(stateOf("reset", results(Mino.T, `${passes(30)}-${passes(39)}`)))).toBe(false);
		expect(FINESSE_DRILL.start(reset).results).toEqual([]);
	});
});
