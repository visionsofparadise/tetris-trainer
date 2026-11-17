import {
	DEFAULT_CONFIG,
	finesseRoutes,
	Game,
	Mino,
	samePlacement,
	type GameKey,
	type PieceTarget,
	type PlaceEvent,
	type ScriptStep,
} from "@tetris-trainer/game";
import { createMutableState } from "opshot";
import { describe, expect, it } from "vitest";
import { continueDrill, createDrillSession, dealDrill, retryMistake, setStage } from "../drill/drillSession";
import { playerOf } from "../drill/player";
import { DEMO_HANDLING } from "../opener/openerScript";
import { FINESSE_DRILL, FINESSE_STAGES, type FinesseStageId } from "./finesseDrill";
import { routeScript } from "./routeScript";
import { FINESSE_SLIDES } from "./slides";
import { targetPlacement } from "./targets";
import type { Player } from "../drill/Drill";

const PLAYER = playerOf(DEFAULT_CONFIG);

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

const playKeys = (game: Game, steps: ReadonlyArray<ScriptStep>): void => {
	for (const step of steps) {
		if ("das" in step) {
			game.press(step.das);
			game.step(DAS_HOLD);
			game.release(step.das);
			game.step(2);
		} else if ("tap" in step) tapKey(game, step.tap);
	}

	tapKey(game, "hardDrop");
};

const judged = (stage: FinesseStageId, target: PieceTarget, play: (game: Game) => void) => {
	const state = { ...FINESSE_DRILL.start(stageOf(stage)), target };
	const { game, state: dealt } = FINESSE_DRILL.deal(state, PLAYER, "same");
	let event: PlaceEvent | null = null;

	game.on("place", (placed) => (event = placed));
	play(game);

	if (event === null) throw new Error("The piece never locked");

	return FINESSE_DRILL.judge(dealt, event, PLAYER).verdict;
};

const kindOf = (verdict: ReturnType<typeof judged>): string => (verdict.ok ? "pass" : verdict.kind);

const placeBy = (game: Game, steps: ReadonlyArray<ScriptStep>): PlaceEvent => {
	let event: PlaceEvent | null = null;

	game.on("place", (placed) => (event = placed));
	game.input(steps);

	for (let frame = 0; frame < FRAME_LIMIT && event === null; frame++) game.step();

	if (event === null) throw new Error("The demo never locked");

	return event;
};

describe("Finesse", () => {
	it("judges spots only in the first stage", () => {
		expect(kindOf(judged("cells", at(Mino.T, "spawn", 0), (game) => playKeys(game, [{ das: "moveLeft" }])))).toBe(
			"pass",
		);
		expect(
			kindOf(
				judged("cells", at(Mino.T, "spawn", 0), (game) =>
					playKeys(game, [{ tap: "moveLeft" }, { tap: "moveLeft" }, { tap: "moveLeft" }]),
				),
			),
		).toBe("pass");
		expect(kindOf(judged("cells", at(Mino.T, "spawn", 0), (game) => playKeys(game, [{ tap: "moveLeft" }])))).toBe(
			"wrong-spot",
		);
	});

	it("judges keys from the second stage on, at 0G and at gravity", () => {
		const gapJ = at(Mino.J, "right", 1);

		expect(kindOf(judged("keys", gapJ, (game) => playKeys(game, [{ das: "moveLeft" }, { tap: "rotateCW" }])))).toBe(
			"pass",
		);
		expect(
			kindOf(
				judged("keys", gapJ, (game) =>
					playKeys(game, [{ tap: "rotateCW" }, { das: "moveLeft" }, { tap: "moveRight" }]),
				),
			),
		).toBe("rotated-before-das");
		expect(kindOf(judged("mixed", at(Mino.S, "right", 3), (game) => playKeys(game, [{ tap: "rotateCCW" }])))).toBe(
			"pass",
		);
		expect(
			kindOf(
				judged("mixed", at(Mino.S, "right", 3), (game) =>
					playKeys(game, [{ tap: "rotateCW" }, { tap: "moveLeft" }]),
				),
			),
		).toBe("wrong-rotation");
		expect(kindOf(judged("gravity", at(Mino.T, "spawn", 7), (game) => playKeys(game, [{ das: "moveRight" }])))).toBe(
			"pass",
		);
		expect(
			kindOf(
				judged("gravity", at(Mino.T, "spawn", 7), (game) =>
					playKeys(game, [{ tap: "moveRight" }, { tap: "moveRight" }, { tap: "moveRight" }, { tap: "moveRight" }]),
				),
			),
		).toBe("tapped-across");
	});

	it("passes a turn pressed while the DAS is still held", () => {
		const verdict = judged("keys", at(Mino.T, "right", 0), (game) => {
			game.press("moveLeft");
			game.step(DAS_HOLD);
			tapKey(game, "rotateCW");
			tapKey(game, "hardDrop");
			game.release("moveLeft");
			game.step(2);
		});

		expect(kindOf(verdict)).toBe("pass");
	});

	it("names a DAS that stops short of the wall", () => {
		const verdict = judged("keys", at(Mino.T, "spawn", 1), (game) => {
			game.press("moveLeft");
			game.step(DEFAULT_CONFIG.handling.das);
			game.release("moveLeft");
			game.step(2);
			tapKey(game, "hardDrop");
		});

		expect(kindOf(verdict)).toBe("partial-das");
	});

	it("restarts the same piece after a retry and draws a new one for the next piece", () => {
		const session = createMutableState(createDrillSession(FINESSE_DRILL));

		dealDrill(session, FINESSE_DRILL, PLAYER);
		setStage(session, FINESSE_DRILL, PLAYER, stageOf("mixed"));

		const { target, seed } = session.state;
		const wrong: ReadonlyArray<ScriptStep> = target.column === 0 ? [{ das: "moveRight" }] : [{ das: "moveLeft" }];

		playKeys(session.game, wrong);
		retryMistake(session);
		dealDrill(session, FINESSE_DRILL, PLAYER);

		expect(session.state).toMatchObject({ target, seed });

		playKeys(session.game, wrong);
		continueDrill(session, FINESSE_DRILL, PLAYER);

		expect(session.state.seed).not.toBe(seed);
		expect(session.state.results).toEqual([
			{ mino: target.mino, ok: false },
			{ mino: target.mino, ok: false },
		]);
	});

	it("restarts the reset run on a fault", () => {
		const session = createMutableState(createDrillSession(FINESSE_DRILL));

		dealDrill(session, FINESSE_DRILL, PLAYER);
		setStage(session, FINESSE_DRILL, PLAYER, stageOf("reset"));

		const minimal = finesseRoutes(session.state.target, PLAYER)[0] ?? [];

		playKeys(session.game, minimal);

		expect(session.state.results).toEqual([{ mino: expect.any(String), ok: true }]);
		expect(session.status).toBe("playing");

		const wrong = finesseRoutes(session.state.target, PLAYER)[0]?.length === 0 ? [{ das: "moveLeft" as const }] : [];

		playKeys(session.game, wrong);

		expect(session.status).toBe("mistake");
		expect(session.state.results.at(-1)?.ok).toBe(false);

		continueDrill(session, FINESSE_DRILL, PLAYER);

		expect(session.status).toBe("playing");
		expect(session.state.results).toEqual([]);
	});

	it("plays a Watch round onto its target and narrates it", () => {
		const round = FINESSE_DRILL.watch?.(PLAYER);

		if (!round) throw new Error("Finesse has a Watch section");

		const event = placeBy(round.game, round.steps);
		const key = (cells: ReadonlyArray<readonly [number, number]>) =>
			cells
				.map(([x, y]) => `${x},${y}`)
				.sort()
				.join(" ");

		expect(key(event.cells)).toBe(key(round.marks[0]?.cells ?? []));
		expect(round.narration.length).toBeGreaterThan(0);
	});

	it("plays every slide's demo onto its target, with and without a 180 key", () => {
		const misses = [PLAYER, NO_180].flatMap((player) =>
			FINESSE_SLIDES.flatMap((slide) =>
				slide.demos.flatMap(({ target, route }) => {
					const game = new Game(DEMO_HANDLING);

					game.setGravity(0);
					game.load({
						board: [],
						validate: false,
						queue: { pieces: [target.mino], mode: "any" },
						holdEnabled: false,
					});

					const steps = routeScript(route === "minimal" ? (finesseRoutes(target, player)[0] ?? []) : route);
					const event = placeBy(game, steps);

					return samePlacement(event.placement, targetPlacement(target)) ? [] : [`${slide.title} ${target.mino}`];
				}),
			),
		);

		expect(misses).toEqual([]);
		expect(FINESSE_SLIDES).toHaveLength(9);
	});
});
