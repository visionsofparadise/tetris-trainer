import { cellsKey, DEFAULT_CONFIG, type Move, type PlaceEvent, type ScriptStep } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { playerOf } from "../drill/player";
import { targetRound, type FamilyId, type TargetRound } from "./families";
import { hasSoftDrop, passingMoves } from "./goal";
import { judgeLanding, playerMoves } from "./judge";
import { roundBoard, roundGame } from "./targetDrill";

const PLAYER = playerOf(DEFAULT_CONFIG);

const FRAME_LIMIT = 900;

const SEEDS = Array.from({ length: 40 }, (_, index) => 7 + index * 7919);

const HARD_DROP: ScriptStep = { tap: "hardDrop" };

const played = (round: TargetRound, keys: ReadonlyArray<ScriptStep>): PlaceEvent => {
	const game = roundGame(round, PLAYER.handling);
	let placed: PlaceEvent | null = null;

	game.on("place", (event) => (placed = event));
	game.input(keys);

	for (let frame = 0; frame < FRAME_LIMIT && placed === null; frame++) game.step();

	if (placed === null) throw new Error("The piece never locked");

	return placed;
};

const judged = (round: TargetRound, keys: ReadonlyArray<ScriptStep>) =>
	judgeLanding(round, played(round, keys), roundBoard(round), PLAYER);

interface Found {
	readonly round: TargetRound;
	readonly move: Move;
}

const findMove = (
	families: ReadonlyArray<FamilyId>,
	wanted: (move: Move, passing: ReadonlyArray<Move>, round: TargetRound) => boolean,
): Found => {
	for (const family of families)
		for (const seed of SEEDS) {
			const round = targetRound(family, seed);
			const moves = playerMoves(roundBoard(round), round, PLAYER);
			const passing = passingMoves(round.goal, moves);
			const move = moves.find((candidate) => wanted(candidate, passing, round));

			if (move) return { round, move };
		}

	throw new Error("No board offers the move");
};

const sameCells = (move: Move, passing: ReadonlyArray<Move>): boolean =>
	passing.some(({ cells }) => cellsKey(cells) === cellsKey(move.cells));

describe("target judge", () => {
	it("passes a passing move on every family", () => {
		for (const family of ["hard-drop", "tuck", "tsd", "tss", "tst", "mini", "s-z", "l-j"] as const) {
			const { round, move } = findMove([family], (candidate, passing) => candidate === passing[0]);

			expect(judged(round, move.keys), family).toBeNull();
		}
	});

	it("calls a soft drop onto a spot a hard drop reaches", () => {
		const { round, move } = findMove(["hard-drop"], (candidate, passing) => candidate === passing[0]);
		const keys = [...move.keys.slice(0, -1), { hold: "softDrop", frames: 40 } as const, HARD_DROP];

		expect(judged(round, keys)).toMatchObject({ kind: "soft-drop", best: round.target });
	});

	it("calls a hard drop short of a tuck, pointing at the tuck", () => {
		const { round, move } = findMove(
			["tuck"],
			(candidate, passing) => !hasSoftDrop(candidate.keys) && !sameCells(candidate, passing),
		);

		expect(judged(round, move.keys)).toMatchObject({ kind: "hard-drop", placed: move.cells, best: round.target });
	});

	it("calls a lock on a slot's cells that scored no spin No spin", () => {
		const { round, move } = findMove(["tsd"], (candidate, passing) => candidate === passing[0]);
		const event = played(round, move.keys);

		expect(judgeLanding(round, { ...event, spin: "none" }, roundBoard(round), PLAYER)).toMatchObject({
			kind: "no-spin",
			showsBefore: true,
		});
	});

	it("calls a T-spin single on a double board Fewer lines, shown on the board before the lock", () => {
		const { round, move } = findMove(["tsd"], (candidate) => candidate.spin === "normal" && candidate.lines === 1);

		expect(judged(round, move.keys)).toMatchObject({ kind: "fewer-lines", showsBefore: true });
	});

	it("calls a mini where a full T-spin was on Mini", () => {
		const { round, move } = findMove(["tsd", "tst"], (candidate) => candidate.spin === "mini");

		expect(judged(round, move.keys)).toMatchObject({ kind: "mini" });
	});

	it("calls a T dropped away from the slot Wrong spot with a passing placement in green", () => {
		const { round, move } = findMove(
			["tsd"],
			(candidate, passing) => candidate.spin === "none" && candidate.lines === 0 && !sameCells(candidate, passing),
		);
		const mistake = judged(round, move.keys);

		expect(mistake).toMatchObject({ kind: "wrong-spot", showsBefore: false });
		expect(mistake?.best?.orientation).toBe("reverse");
	});
});
