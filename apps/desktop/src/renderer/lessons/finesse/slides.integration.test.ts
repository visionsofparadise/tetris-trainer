import {
	BOARD_COLUMNS,
	DEFAULT_CONFIG,
	finesseRoutes,
	Game,
	minimalPresses,
	Mino,
	placementCells,
	type Block,
	type GameKey,
	type Piece,
	type PieceTarget,
	type ScriptStep,
	type ShiftKey,
} from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { FINESSE_SLIDES, slideNotes } from "./slides";
import { FINESSE_TARGETS, pieceSetup, targetPlacement } from "./targets";
import type { Player } from "../drill/Drill";

const PLAYERS: ReadonlyArray<Player> = [
	{ handling: DEFAULT_CONFIG.handling, allow180: true },
	{ handling: DEFAULT_CONFIG.handling, allow180: false },
];

const FRAME_LIMIT = 600;

const TURNING: ReadonlyArray<Piece> = [Mino.I, Mino.T, Mino.J, Mino.L, Mino.S, Mino.Z];

const TURNS: ReadonlyArray<GameKey> = ["rotateCW", "rotateCCW", "rotate180"];

const WALLS: ReadonlyArray<{ readonly das: ShiftKey; readonly away: GameKey }> = [
	{ das: "moveLeft", away: "rotateCW" },
	{ das: "moveRight", away: "rotateCCW" },
];

const isTurnStep = (step: ScriptStep): boolean => "tap" in step && TURNS.includes(step.tap);

const land = (mino: Piece, steps: ReadonlyArray<ScriptStep>): ReadonlyArray<Block> => {
	const game = new Game(DEFAULT_CONFIG.handling);
	let cells: ReadonlyArray<Block> | null = null;

	game.setGravity(0);
	game.load(pieceSetup(mino));
	game.on("place", (event) => (cells = event.cells));
	game.input([...steps, { tap: "hardDrop" }]);

	for (let frame = 0; frame < FRAME_LIMIT && cells === null; frame++) game.step();

	if (cells === null) throw new Error("The piece never locked");

	return cells;
};

const leftColumn = (cells: ReadonlyArray<Block>): number => Math.min(...cells.map(([x]) => x));

const atWall = (cells: ReadonlyArray<Block>, key: ShiftKey): boolean =>
	key === "moveLeft" ? leftColumn(cells) === 0 : Math.max(...cells.map(([x]) => x)) === BOARD_COLUMNS - 1;

const groups = (route: ReadonlyArray<ScriptStep>): number =>
	route.filter((step, index) => index === 0 || isTurnStep(step) !== isTurnStep(route[index - 1] ?? step)).length;

const tapsOneWay = (route: ReadonlyArray<ScriptStep>, key: GameKey): number =>
	route.filter((step) => "tap" in step && step.tap === key).length;

const notesOf = (title: string, allow180 = true): ReadonlyArray<string> => {
	const slide = FINESSE_SLIDES.find((candidate) => candidate.title === title);

	return slide ? slideNotes(slide, allow180) : [];
};

const named = ({ mino, orientation, column }: PieceTarget): string => `${mino} ${orientation} ${column}`;

describe("Finesse slide notes", () => {
	it("Two steps: every spot has a shortest route of one turn and one move, at most three presses with a 180", () => {
		expect(notesOf("Two steps")).toContain(
			"On an empty board every spot takes two steps at most, a turn and a move, then the drop.",
		);

		for (const player of PLAYERS) {
			const longer = FINESSE_TARGETS.filter((target) =>
				finesseRoutes(target, player).every((route) => groups(route) > 2),
			);

			expect(longer.map(named)).toEqual([]);
		}

		expect(Math.max(...FINESSE_TARGETS.map((target) => minimalPresses(target, { allow180: true })))).toBe(3);
	});

	it("Never three taps: a flat piece one column off a wall is a DAS and a tap back, and no shortest route taps three times one way", () => {
		expect(notesOf("Never three taps")).toEqual([
			"A flat piece one column off the wall is a DAS and a tap back.",
			"Three taps would cost one press more.",
		]);

		for (const player of PLAYERS) {
			const flatOffWall = FINESSE_TARGETS.filter(
				(target) => target.mino === Mino.O || target.orientation === "spawn" || target.orientation === "reverse",
			).flatMap((target) => {
				const columns = placementCells(targetPlacement(target)).map(([x]) => x);
				const wall: ShiftKey | null =
					Math.min(...columns) === 1
						? "moveLeft"
						: Math.max(...columns) === BOARD_COLUMNS - 2
							? "moveRight"
							: null;

				return wall === null ? [] : [{ target, wall }];
			});
			const misses = flatOffWall.filter(
				({ target, wall }) =>
					!finesseRoutes(target, player).some((route) => {
						const shifts = route.filter((step) => !isTurnStep(step));
						const [first] = shifts;
						const back = wall === "moveLeft" ? "moveRight" : "moveLeft";

						return (
							shifts.length === 2 &&
							first !== undefined &&
							"das" in first &&
							first.das === wall &&
							tapsOneWay(shifts, back) === 1
						);
					}),
			);
			const threeTaps = FINESSE_TARGETS.filter((target) =>
				finesseRoutes(target, player).some(
					(route) => tapsOneWay(route, "moveLeft") >= 3 || tapsOneWay(route, "moveRight") >= 3,
				),
			);

			expect(flatOffWall.length).toBeGreaterThan(0);
			expect(misses.map(({ target }) => named(target))).toEqual([]);
			expect(threeTaps.map(named)).toEqual([]);
		}
	});

	it("The gap rule: a turn then a DAS sits flush, and a DAS then a turn away from the wall stands off it", () => {
		const misses = TURNING.flatMap((mino) =>
			WALLS.flatMap(({ das, away }) => [
				...TURNS.flatMap((turn) =>
					atWall(land(mino, [{ tap: turn }, { das }]), das) ? [] : [`${mino} ${turn} then DAS ${das}`],
				),
				...(atWall(land(mino, [{ das }, { tap: away }]), das) ? [`${mino} DAS ${das} then ${away}`] : []),
			]),
		);

		expect(misses).toEqual([]);
	});

	it("Rotate toward travel: after a DAS left, CCW keeps the S against the wall", () => {
		expect(notesOf("Rotate toward travel")).toEqual(["After a DAS left, CCW keeps the S against the wall."]);
		expect(atWall(land(Mino.S, [{ das: "moveLeft" }, { tap: "rotateCCW" }]), "moveLeft")).toBe(true);
	});

	it("Two verticals: from spawn, CW stands S, Z and I one column right of CCW", () => {
		const offsets = ([Mino.S, Mino.Z, Mino.I] as const).map(
			(mino) => leftColumn(land(mino, [{ tap: "rotateCW" }])) - leftColumn(land(mino, [{ tap: "rotateCCW" }])),
		);

		expect(offsets).toEqual([1, 1, 1]);
	});

	it("One table: J and L take the T's routes everywhere, and flat S and Z take the flat T's", () => {
		for (const player of PLAYERS) {
			const misses = FINESSE_TARGETS.filter(
				(target) =>
					target.mino !== Mino.T &&
					(target.mino === Mino.J ||
						target.mino === Mino.L ||
						((target.mino === Mino.S || target.mino === Mino.Z) && target.orientation === "spawn")),
			).filter(
				(target) =>
					JSON.stringify(finesseRoutes(target, player)) !==
					JSON.stringify(finesseRoutes({ ...target, mino: Mino.T }, player)),
			);

			expect(misses.map(named)).toEqual([]);
		}
	});

	it("South: upside down is a 180 (or two turns in a row) followed by the flat keys", () => {
		expect(notesOf("South")).toContain("Upside down is a 180, then the flat keys.");
		expect(notesOf("South", false)).toEqual(["Upside down is two turns in a row the same way, then the flat keys."]);

		for (const player of PLAYERS) {
			const turns: ReadonlyArray<ReadonlyArray<ScriptStep>> = player.allow180
				? [[{ tap: "rotate180" }]]
				: [
						[{ tap: "rotateCW" }, { tap: "rotateCW" }],
						[{ tap: "rotateCCW" }, { tap: "rotateCCW" }],
					];
			const misses = FINESSE_TARGETS.filter((target) => target.orientation === "reverse").filter((target) => {
				const flat = finesseRoutes({ ...target, orientation: "spawn" }, player).map((route) =>
					JSON.stringify(route),
				);
				const routes = finesseRoutes(target, player);

				return !routes.some((route) =>
					turns.some(
						(turn) =>
							JSON.stringify(route.slice(0, turn.length)) === JSON.stringify(turn) &&
							flat.includes(JSON.stringify(route.slice(turn.length))),
					),
				);
			});

			expect(misses.map(named)).toEqual([]);
		}
	});

	it("Ties: T flat at column 1 has two shortest routes", () => {
		for (const player of PLAYERS)
			expect(finesseRoutes({ mino: Mino.T, orientation: "spawn", column: 1 }, player)).toHaveLength(2);
	});
});
