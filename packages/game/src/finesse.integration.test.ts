import { Mino } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { BOARD_COLUMNS } from "./engineOptions";
import { dropSteps } from "./finesse";
import { Game } from "./Game";
import { BAG, ORIENTATIONS, placementCells, samePlacement, type Placement } from "./pieces";
import type { Handling } from "./config";

const HANDLINGS: ReadonlyArray<[string, Handling]> = [
	["default handling", DEFAULT_CONFIG.handling],
	["instant ARR", { ...DEFAULT_CONFIG.handling, das: 7, arr: 0 }],
];

const floorPlacements: ReadonlyArray<Placement> = BAG.flatMap((mino) =>
	ORIENTATIONS.flatMap((orientation) =>
		Array.from({ length: BOARD_COLUMNS }, (_, column): Placement => ({ mino, orientation, column, row: 0 })).filter(
			(placement) => placementCells(placement).every(([x]) => x < BOARD_COLUMNS),
		),
	),
);

const landing = (placement: Placement, handling: Handling): Placement | undefined => {
	const game = new Game(handling, 1);
	let placed: Placement | undefined;

	game.load({
		board: [],
		validate: true,
		queue: { pieces: [placement.mino], mode: "fresh-bag" },
		holdEnabled: true,
		seed: 1,
	});
	game.on("place", (event) => (placed ??= event.placement));
	game.input(dropSteps(placement));
	game.step(120);

	return placed;
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
