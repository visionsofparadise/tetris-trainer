import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { BOARD_COLUMNS } from "./engineOptions";
import { dropSteps, finesseRoutes, finesseTargets, pathCells, routeCells, type FinesseOptions } from "./finesse";
import { Game } from "./Game";
import { BAG, cellsKey, ORIENTATIONS, placementCells, samePlacement, type Piece, type Placement } from "./pieces";
import type { Handling } from "./config";
import type { KeyPress } from "./inputs";
import type { GameKey, ScriptStep } from "./script";

const HANDLINGS: ReadonlyArray<[string, Handling]> = [
	["default handling", DEFAULT_CONFIG.handling],
	["instant ARR", { ...DEFAULT_CONFIG.handling, das: 7, arr: 0 }],
];

const ALLOW_180: ReadonlyArray<boolean> = [true, false];

const FRAME_LIMIT = 400;

const PRESSES: ReadonlyArray<ScriptStep> = [
	{ tap: "moveLeft" },
	{ tap: "moveRight" },
	{ das: "moveLeft" },
	{ das: "moveRight" },
	{ tap: "rotateCW" },
	{ tap: "rotateCCW" },
	{ tap: "rotate180" },
];

const floorPlacements: ReadonlyArray<Placement> = BAG.flatMap((mino) =>
	ORIENTATIONS.flatMap((orientation) =>
		Array.from({ length: BOARD_COLUMNS }, (_, column): Placement => ({ mino, orientation, column, row: 0 })).filter(
			(placement) => placementCells(placement).every(([x]) => x < BOARD_COLUMNS),
		),
	),
);

const placementKey = (placement: Placement): string => cellsKey(placementCells(placement));

const land = (game: Game, mino: Piece, steps: ReadonlyArray<ScriptStep>): Placement | undefined => {
	let placed: Placement | undefined;

	game.load({ board: [], validate: true, queue: { pieces: [mino], mode: "fresh-bag" }, holdEnabled: true, seed: 1 });

	const off = game.on("place", (event) => (placed ??= event.placement));

	game.input(steps);

	for (let frame = 0; placed === undefined && frame < FRAME_LIMIT; frame++) game.step();

	off();

	return placed;
};

const landing = (placement: Placement, handling: Handling): Placement | undefined =>
	land(new Game(handling, 1), placement.mino, dropSteps(placement));

const sequences = (length: number, presses: ReadonlyArray<ScriptStep>): Array<Array<ScriptStep>> =>
	length === 0
		? [[]]
		: sequences(length - 1, presses).flatMap((sequence) => presses.map((press) => [...sequence, press]));

const bruteForce = (mino: Piece, options: FinesseOptions): Map<string, Set<string>> => {
	const presses = options.allow180
		? PRESSES
		: PRESSES.filter((press) => !("tap" in press && press.tap === "rotate180"));
	const game = new Game(DEFAULT_CONFIG.handling, 1);
	const shortest = new Map<string, { length: number; routes: Set<string> }>();

	for (let length = 0; length <= (options.allow180 ? 4 : 5); length++)
		for (const sequence of sequences(length, presses)) {
			const placed = land(game, mino, [...sequence, { tap: "hardDrop" }]);

			if (placed === undefined) throw new Error(`No lock after ${JSON.stringify(sequence)}`);

			const key = placementKey(placed);
			const best = shortest.get(key) ?? { length, routes: new Set<string>() };

			shortest.set(key, best);

			if (best.length === length) best.routes.add(JSON.stringify(sequence));
		}

	return new Map([...shortest].map(([key, { routes }]) => [key, routes]));
};

describe("dropSteps", () => {
	it.each(HANDLINGS)("lands every piece in every orientation and column with %s", (_name, handling) => {
		const misses = floorPlacements.filter((placement) => {
			const placed = landing(placement, handling);

			return placed === undefined || !samePlacement(placed, placement);
		});

		expect(misses).toEqual([]);
		expect(floorPlacements.filter(({ mino }) => mino === Mino.I)).toHaveLength(BOARD_COLUMNS * 2 + 7 * 2);
	});
});

describe("finesseRoutes", () => {
	it.each(HANDLINGS)("lands every route of every target with %s", (_name, handling) => {
		const game = new Game(handling, 1);
		const misses = ALLOW_180.flatMap((allow180) =>
			finesseTargets().flatMap((target) =>
				finesseRoutes(target, { allow180 })
					.filter((route) => {
						const placed = land(game, target.mino, [...route, { tap: "hardDrop" }]);

						return placed === undefined || !samePlacement(placed, { ...target, row: 0 });
					})
					.map((route) => ({ target, allow180, route })),
			),
		);

		expect(misses).toEqual([]);
	});

	describe.each(ALLOW_180)("with allow180 %s", (allow180) => {
		it.each(BAG)("equals a brute force over short key sequences for %s", (mino) => {
			const shortest = bruteForce(mino, { allow180 });
			const targets = finesseTargets().filter((target) => target.mino === mino);
			const searched = new Map(
				targets.map((target) => [
					placementKey({ ...target, row: 0 }),
					new Set(finesseRoutes(target, { allow180 }).map((route) => JSON.stringify(route))),
				]),
			);

			expect(shortest).toEqual(searched);
		});
	});
});

describe("path cells", () => {
	const tap = (key: GameKey, down: number): KeyPress => ({
		key,
		source: "user",
		down,
		up: down + 2,
		blocked: false,
		carried: false,
	});

	it("lands the player's three taps, soft drop included and hard drop left out", () => {
		const presses = [
			tap("moveRight", 0),
			tap("moveRight", 5),
			tap("softDrop", 8),
			tap("moveRight", 10),
			tap("hardDrop", 15),
		];

		expect(pathCells(presses, DEFAULT_CONFIG.handling, Mino.T)).toEqual([
			[
				[5, 1],
				[4, 0],
				[5, 0],
				[6, 0],
			],
			[
				[6, 1],
				[5, 0],
				[6, 0],
				[7, 0],
			],
			[
				[6, 1],
				[5, 0],
				[6, 0],
				[7, 0],
			],
			[
				[7, 1],
				[6, 0],
				[7, 0],
				[8, 0],
			],
		]);
	});

	it("replays the key timings, so a DAS stopped short and a floor kick land where they did", () => {
		const held = (key: GameKey, down: number, up: number): KeyPress => ({ ...tap(key, down), up });

		expect(pathCells([held("moveLeft", 0, 10)], DEFAULT_CONFIG.handling, Mino.L)).toEqual([
			[
				[3, 1],
				[1, 0],
				[2, 0],
				[3, 0],
			],
		]);
		expect(pathCells([held("softDrop", 0, 90), tap("rotateCW", 95)], DEFAULT_CONFIG.handling, Mino.T)).toEqual([
			[
				[4, 1],
				[3, 0],
				[4, 0],
				[5, 0],
			],
			[
				[4, 1],
				[3, 2],
				[3, 1],
				[3, 0],
			],
		]);
	});

	it("lands each step of a route", () => {
		expect(routeCells([{ das: "moveRight" }, { tap: "moveLeft" }], Mino.T)).toEqual([
			[
				[8, 1],
				[7, 0],
				[8, 0],
				[9, 0],
			],
			[
				[7, 1],
				[6, 0],
				[7, 0],
				[8, 0],
			],
		]);
	});
});
