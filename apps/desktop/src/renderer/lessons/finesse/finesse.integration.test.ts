import {
	cellsKey,
	DEFAULT_CONFIG,
	DEMO_HANDLING,
	finesseRoutes,
	Game,
	minimalPresses,
	Mino,
	placementCells,
	samePlacement,
	type GameKey,
	type PieceTarget,
	type PlaceEvent,
	type ScriptStep,
} from "@tetris-trainer/game";
import { createMutableState } from "opshot";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLocalSearch } from "../../search/localSearch";
import { searchStateOf } from "../../search/searchStateOf";
import { continueDrill, createDrillSession, dealDrill, retryMistake, setStage } from "../drill/drillSession";
import { playerOf } from "../drill/player";
import { FINESSE_DRILL, FINESSE_STAGES, startFinesse, type FinesseStageId } from "./finesseDrill";
import { routeScript } from "./routeScript";
import { FINESSE_SLIDES } from "./slides";
import { FINESSE_TARGETS, pieceSetup, targetPlacement } from "./targets";
import type { DrillLock, JudgeContext, Player } from "../drill/Drill";

const PLAYER = playerOf(DEFAULT_CONFIG);

const JUDGE: JudgeContext = { player: PLAYER, search: createLocalSearch() };

const NO_180: Player = { ...PLAYER, allow180: false };

const DAS_HOLD = DEFAULT_CONFIG.handling.das + 10 * DEFAULT_CONFIG.handling.arr + 2;

const FRAME_LIMIT = 600;

const stageOf = (id: FinesseStageId) => {
	const stage = FINESSE_STAGES.find((candidate) => candidate.id === id);

	if (!stage) throw new Error(`No ${id} stage`);

	return stage;
};

const at = (mino: PieceTarget["mino"], orientation: PieceTarget["orientation"], column: number): PieceTarget => ({
	mino,
	orientation,
	column,
});

const tapKey = (game: Game, key: GameKey): void => {
	game.press(key);
	game.step(2);
	game.release(key);
	game.step(2);
};

const pressKeys = (game: Game, steps: ReadonlyArray<ScriptStep>): void => {
	for (const step of steps) {
		if ("das" in step) {
			game.press(step.das);
			game.step(DAS_HOLD);
			game.release(step.das);
			game.step(2);
		} else if ("tap" in step) tapKey(game, step.tap);
	}
};

const playKeys = (game: Game, steps: ReadonlyArray<ScriptStep>): void => {
	pressKeys(game, steps);
	tapKey(game, "hardDrop");
};

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const lockOn = (game: Game, event: PlaceEvent): DrillLock => ({
	event,
	before: searchStateOf(game),
	after: searchStateOf(game),
});

const judged = async (stage: FinesseStageId, target: PieceTarget, play: (game: Game) => void) => {
	const state = { ...FINESSE_DRILL.start(stageOf(stage), SEED), target };
	const { game, state: dealt } = FINESSE_DRILL.deal(state, PLAYER, "same");
	const before = searchStateOf(game);
	let lock: DrillLock | null = null;

	game.on("place", (event) => (lock = { event, before, after: searchStateOf(game) }));
	play(game);

	if (lock === null) throw new Error("The piece never locked");

	return (await FINESSE_DRILL.judge(dealt, lock, JUDGE)).verdict;
};

const kindOf = async (judgement: ReturnType<typeof judged>): Promise<string> => {
	const verdict = await judgement;

	return verdict.ok ? "pass" : verdict.kind;
};

const placeOn = (target: PieceTarget): PlaceEvent => {
	const placement = targetPlacement(target);

	return {
		placement,
		cells: placementCells(placement),
		lines: 0,
		spin: "none",
		combo: 0,
		b2b: 0,
		attack: 0,
		isPerfectClear: false,
		inputs: [],
	};
};

const lowestRow = (game: Game): number => Math.min(...game.falling.blocks.map(([, y]) => y));

const SEED = 20261117;

const T_FLAT: PieceTarget = { mino: Mino.T, orientation: "spawn", column: 3 };

const placeBy = (game: Game, steps: ReadonlyArray<ScriptStep>): PlaceEvent => {
	let event: PlaceEvent | null = null;

	game.on("place", (placed) => (event = placed));
	game.input(steps);

	for (let frame = 0; frame < FRAME_LIMIT && event === null; frame++) game.step();

	if (event === null) throw new Error("The demo never locked");

	return event;
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Finesse", () => {
	it("deals only the newest unlocked piece in a per-piece stage", () => {
		const unlocked = {
			...startFinesse("cells", SEED),
			results: Array.from({ length: 20 }, () => ({ mino: Mino.O as const, ok: true })),
		};

		expect(FINESSE_DRILL.deal(unlocked, PLAYER, "next").state.target.mino).toBe(Mino.I);
	});

	it("re-deals the same target for the same round and draws a new one for the next", async () => {
		const start = { ...startFinesse("mixed", SEED), target: T_FLAT };
		const { game, state: again } = FINESSE_DRILL.deal(start, PLAYER, "same");
		const { verdict, next } = await FINESSE_DRILL.judge(again, lockOn(game, placeOn(T_FLAT)), JUDGE);
		const drawn = FINESSE_DRILL.deal(next, PLAYER, "next").state;

		expect(again).toEqual(start);
		expect(verdict).toEqual({ ok: true });
		expect(next.results).toEqual([{ mino: Mino.T, ok: true }]);
		expect(drawn.seed).not.toBe(start.seed);
		expect(drawn.results).toEqual(next.results);
	});

	it("records a wrong spot", async () => {
		const start = { ...startFinesse("cells", SEED), target: T_FLAT };
		const { game } = FINESSE_DRILL.deal(start, PLAYER, "same");
		const { verdict, next } = await FINESSE_DRILL.judge(
			start,
			lockOn(game, placeOn({ ...T_FLAT, column: 4 })),
			JUDGE,
		);

		expect(verdict).toMatchObject({ ok: false, kind: "wrong-spot", best: targetPlacement(T_FLAT) });
		expect(next.results).toEqual([{ mino: Mino.T, ok: false }]);
	});

	it("drops the piece by gravity only in the gravity stage", () => {
		const fallen = (stage: FinesseStageId): boolean => {
			const { game } = FINESSE_DRILL.deal({ ...startFinesse(stage, SEED), target: T_FLAT }, PLAYER, "same");
			const spawned = lowestRow(game);

			game.step(60);

			return lowestRow(game) < spawned;
		};

		expect(fallen("gravity")).toBe(true);
		expect(fallen("mixed")).toBe(false);
	});

	it("judges spots only in the first stage", async () => {
		expect(
			await kindOf(judged("cells", at(Mino.T, "spawn", 0), (game) => playKeys(game, [{ das: "moveLeft" }]))),
		).toBe("pass");
		expect(
			await kindOf(
				judged("cells", at(Mino.T, "spawn", 0), (game) =>
					playKeys(game, [{ tap: "moveLeft" }, { tap: "moveLeft" }, { tap: "moveLeft" }]),
				),
			),
		).toBe("pass");
		expect(
			await kindOf(judged("cells", at(Mino.T, "spawn", 0), (game) => playKeys(game, [{ tap: "moveLeft" }]))),
		).toBe("wrong-spot");
	});

	it("judges keys from the second stage on, at 0G and at gravity", async () => {
		const gapJ = at(Mino.J, "right", 1);

		expect(
			await kindOf(judged("keys", gapJ, (game) => playKeys(game, [{ das: "moveLeft" }, { tap: "rotateCW" }]))),
		).toBe("pass");
		expect(
			await kindOf(
				judged("keys", gapJ, (game) =>
					playKeys(game, [{ tap: "rotateCW" }, { das: "moveLeft" }, { tap: "moveRight" }]),
				),
			),
		).toBe("rotated-before-das");
		expect(
			await kindOf(judged("mixed", at(Mino.S, "right", 3), (game) => playKeys(game, [{ tap: "rotateCCW" }]))),
		).toBe("pass");
		expect(
			await kindOf(
				judged("mixed", at(Mino.T, "spawn", 1), (game) =>
					playKeys(game, [{ das: "moveLeft" }, { tap: "moveRight" }]),
				),
			),
		).toBe("pass");
		expect(
			await kindOf(
				judged("mixed", at(Mino.S, "right", 3), (game) =>
					playKeys(game, [{ tap: "rotateCW" }, { tap: "moveLeft" }]),
				),
			),
		).toBe("wrong-rotation");
		expect(
			await kindOf(judged("gravity", at(Mino.T, "spawn", 7), (game) => playKeys(game, [{ das: "moveRight" }]))),
		).toBe("pass");
		expect(
			await kindOf(
				judged("gravity", at(Mino.T, "spawn", 7), (game) =>
					playKeys(game, [{ tap: "moveRight" }, { tap: "moveRight" }, { tap: "moveRight" }, { tap: "moveRight" }]),
				),
			),
		).toBe("tapped-across");
	});

	it("passes a turn pressed while the DAS is still held", async () => {
		const verdict = judged("keys", at(Mino.T, "right", 0), (game) => {
			game.press("moveLeft");
			game.step(DAS_HOLD);
			tapKey(game, "rotateCW");
			tapKey(game, "hardDrop");
			game.release("moveLeft");
			game.step(2);
		});

		expect(await kindOf(verdict)).toBe("pass");
	});

	it("names a turn kicked off the floor after a soft drop or a fall", async () => {
		const kickedT = at(Mino.T, "right", 3);
		const softDropped = judged("keys", kickedT, (game) => {
			game.press("softDrop");
			game.step(70);
			game.release("softDrop");
			game.step(2);
			playKeys(game, [{ tap: "rotateCW" }]);
		});
		const fallen = judged("gravity", kickedT, (game) => {
			while (lowestRow(game) > 0) game.step();

			playKeys(game, [{ tap: "rotateCW" }]);
		});

		expect(await kindOf(softDropped)).toBe("floor-kick");
		expect(await kindOf(fallen)).toBe("floor-kick");
	});

	it("names a minimal count that reaches its target only by a floor kick in Gravity", async () => {
		const kicks: ReadonlyArray<[PieceTarget, ScriptStep]> = [
			[at(Mino.T, "right", 0), { das: "moveLeft" }],
			[at(Mino.J, "right", 0), { das: "moveLeft" }],
			[at(Mino.L, "right", 0), { das: "moveLeft" }],
			[at(Mino.I, "right", 3), { das: "moveLeft" }],
			[at(Mino.S, "right", 2), { tap: "moveLeft" }],
		];
		const kinds = await Promise.all(
			kicks.map(([target, shift]) =>
				kindOf(
					judged("gravity", target, (game) => {
						pressKeys(game, [shift]);

						while (lowestRow(game) > 0) game.step();

						playKeys(game, [{ tap: "rotateCW" }]);
					}),
				),
			),
		);

		expect(kinds).toEqual(["floor-kick", "floor-kick", "floor-kick", "floor-kick", "floor-kick"]);
	});

	it("names a DAS that stops short of the wall", async () => {
		const verdict = judged("keys", at(Mino.T, "spawn", 1), (game) => {
			game.press("moveLeft");
			game.step(DEFAULT_CONFIG.handling.das);
			game.release("moveLeft");
			game.step(2);
			tapKey(game, "hardDrop");
		});

		expect(await kindOf(verdict)).toBe("partial-das");
	});

	it("restarts the same piece after a retry and draws a new one for the next piece", async () => {
		const session = createMutableState(createDrillSession(FINESSE_DRILL));

		dealDrill(session, FINESSE_DRILL, JUDGE);
		setStage(session, FINESSE_DRILL, JUDGE, stageOf("mixed"));

		const { target, seed } = session.state;
		const wrong: ReadonlyArray<ScriptStep> = target.column === 0 ? [{ das: "moveRight" }] : [{ das: "moveLeft" }];

		playKeys(session.game, wrong);
		await settle();
		retryMistake(session, FINESSE_DRILL, JUDGE);
		dealDrill(session, FINESSE_DRILL, JUDGE);

		expect(session.state).toMatchObject({ target, seed });

		playKeys(session.game, wrong);
		await settle();
		continueDrill(session, FINESSE_DRILL, JUDGE);

		expect(session.state.seed).not.toBe(seed);
		expect(session.state.results).toEqual([
			{ mino: target.mino, ok: false },
			{ mino: target.mino, ok: false },
		]);
	});

	it("restarts the reset run on a fault", async () => {
		const session = createMutableState(createDrillSession(FINESSE_DRILL));

		dealDrill(session, FINESSE_DRILL, JUDGE);
		setStage(session, FINESSE_DRILL, JUDGE, stageOf("reset"));

		const minimal = finesseRoutes(session.state.target, PLAYER)[0] ?? [];

		playKeys(session.game, minimal);
		await settle();

		expect(session.state.results).toEqual([{ mino: expect.any(String), ok: true }]);
		expect(session.status).toBe("playing");

		const wrong = finesseRoutes(session.state.target, PLAYER)[0]?.length === 0 ? [{ das: "moveLeft" as const }] : [];

		playKeys(session.game, wrong);
		await settle();

		expect(session.status).toBe("mistake");
		expect(session.state.results.at(-1)?.ok).toBe(false);

		continueDrill(session, FINESSE_DRILL, JUDGE);

		expect(session.status).toBe("playing");
		expect(session.state.results).toEqual([]);
	});

	it("plays a Watch round onto its target and narrates the rules it shows by slide title", async () => {
		const gapJ = FINESSE_TARGETS.findIndex(
			({ mino, orientation, column }) => mino === Mino.J && orientation === "right" && column === 1,
		);

		vi.spyOn(Math, "random").mockReturnValue((gapJ + 0.5) / FINESSE_TARGETS.length);

		const round = FINESSE_DRILL.watch?.(PLAYER, JUDGE.search, 0);

		if (!round) throw new Error("Finesse has a Watch section");

		const { steps, line } = await round.play(searchStateOf(round.game));
		const event = placeBy(round.game, steps);

		expect(line).toBeNull();

		expect(cellsKey(event.cells)).toBe(cellsKey(placementCells(targetPlacement(at(Mino.J, "right", 1)))));
		expect(round.narration).toEqual(["DAS to the wall", "The gap rule", "Rotate toward travel"]);
	});

	it("plays every slide's demo onto its target, with and without a 180 key", () => {
		const misses = [PLAYER, NO_180].flatMap((player) =>
			FINESSE_SLIDES.flatMap((slide) =>
				slide.demos.flatMap(({ target, route }) => {
					const game = new Game(DEMO_HANDLING);

					game.setGravity(0);
					game.load(pieceSetup(target.mino));

					const steps = routeScript(route === "minimal" ? (finesseRoutes(target, player)[0] ?? []) : route);
					const event = placeBy(game, steps);

					return samePlacement(event.placement, targetPlacement(target)) ? [] : [`${slide.title} ${target.mino}`];
				}),
			),
		);

		expect(misses).toEqual([]);
		expect(FINESSE_SLIDES).toHaveLength(9);
		expect(FINESSE_SLIDES[0]?.demos.map(({ target }) => minimalPresses(target, PLAYER))).toEqual([0, 1, 2, 3]);
	});
});
