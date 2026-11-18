import {
	DEFAULT_CONFIG,
	generateMoves,
	placementCells,
	type Game,
	type PlaceEvent,
	type ScriptStep,
} from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { playerOf } from "../drill/player";
import { moveRules, targetRound, type FamilyId } from "./families";
import { meetsGoal } from "./goal";
import { landingOf } from "./judge";
import { isOpenAbove } from "./sketch";
import { passingMove, roundBoard, roundGame } from "./targetDrill";

const FAMILIES: ReadonlyArray<FamilyId> = ["hard-drop", "tuck", "tsd", "tss", "tst", "mini", "s-z", "l-j"];

const SEEDS = Array.from({ length: 60 }, (_, index) => 1 + index * 104729);

const PLAYER = playerOf(DEFAULT_CONFIG);

const FRAME_LIMIT = 900;

const playKeys = (game: Game, keys: ReadonlyArray<ScriptStep>): PlaceEvent | null => {
	let placed: PlaceEvent | null = null;
	const off = game.on("place", (event) => (placed = event));

	game.input(keys);

	for (let frame = 0; frame < FRAME_LIMIT && placed === null; frame++) game.step();

	off();

	return placed;
};

describe.each(FAMILIES)("%s boards", (family) => {
	it("come out the same for the same seed", () => {
		expect(targetRound(family, 77)).toEqual(targetRound(family, 77));
	});

	it("hold no complete row, and the engine plays a passing move to meet the goal", () => {
		const wrong = SEEDS.flatMap((seed) => {
			const round = targetRound(family, seed);
			const board = roundBoard(round);
			const move = passingMove(round, PLAYER);
			const event = move && playKeys(roundGame(round, PLAYER.handling), move.keys);
			const full = board.rows.some((row) => row === 0b1111111111);

			return full || event === null || !meetsGoal(round.goal, landingOf(event))
				? [`${seed}: ${round.rows.join("/")}`]
				: [];
		});

		expect(wrong).toEqual([]);
	});
});

describe("drop boards", () => {
	it("leave a hard-drop target open from above and cover a tuck target", () => {
		for (const seed of SEEDS) {
			const open = targetRound("hard-drop", seed);
			const covered = targetRound("tuck", seed);

			expect(isOpenAbove(roundBoard(open), placementCells(open.target))).toBe(true);
			expect(isOpenAbove(roundBoard(covered), placementCells(covered.target))).toBe(false);
		}
	});
});

describe("T-spin boards", () => {
	const spins = (family: FamilyId, seed: number): Array<string> => {
		const round = targetRound(family, seed);

		return generateMoves(roundBoard(round), round.mino, moveRules(true), { handling: PLAYER.handling, gravity: 0 })
			.filter(({ spin, lines }) => spin !== "none" && lines > 0)
			.map(({ spin, lines }) => `${spin} ${lines}`);
	};

	it("offer a double but no triple on a double board, and only minis on a mini board", () => {
		for (const seed of SEEDS) {
			expect(spins("tsd", seed)).toContain("normal 2");
			expect(spins("tsd", seed)).not.toContain("normal 3");
			expect(spins("mini", seed).filter((spin) => spin.startsWith("normal"))).toEqual([]);
		}
	});
});
