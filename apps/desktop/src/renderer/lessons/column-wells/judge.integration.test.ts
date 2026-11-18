import {
	cellsKey,
	DEFAULT_CONFIG,
	generateMoves,
	Mino,
	placementCells,
	type BoardItem,
	type PlaceEvent,
	type Placement,
	type ScriptStep,
} from "@tetris-trainer/game";
import { createMutableState } from "opshot";
import { describe, expect, it } from "vitest";
import { createLocalSearch } from "../../search/localSearch";
import { searchStateOf } from "../../search/searchStateOf";
import { createDrillSession, setStage } from "../drill/drillSession";
import { playerOf } from "../drill/player";
import { openingGame, type WellsOpening } from "./boards";
import { DEV_BOARDS, devOpening, type DevBoardName } from "./devBoards";
import { callLock, type WellsCall } from "./judge";
import { moverOf, THREE_SIDE } from "./rules";
import { wellStage, type WellStageId } from "./stages";
import { playAsUser } from "./userPlay";
import { startWells, WELLS_DRILL, type WellsState } from "./wellsDrill";
import type { Drill, JudgeContext } from "../drill/Drill";
import type { WellStage } from "./stages";

const JUDGE: JudgeContext = { player: playerOf(DEFAULT_CONFIG), search: createLocalSearch() };

const OPEN_RULES = {
	allow180: true,
	excluded: {},
	holeFreeOnly: false,
	ceiling: null,
	quadClearsOnly: false,
	deadRows: 0,
};

const FRAME_LIMIT = 900;

const HOLD: ReadonlyArray<ScriptStep> = [{ tap: "hold" }];

const MISTAKE_BOARDS = [
	"well-blocked",
	"wrong-side",
	"hole",
	"homeless",
	"slow-count",
	"non-quad-clear",
	"over-ceiling",
] as const;

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const judgeOpening = async (stageId: WellStageId, opening: WellsOpening, play: Placement): Promise<WellsCall> => {
	const { player } = JUDGE;
	const game = openingGame(opening, player.handling);
	const before = searchStateOf(game);
	const target = cellsKey(placementCells(play));
	const move = generateMoves(before.board, play.mino, OPEN_RULES, moverOf(player)).find(
		({ cells }) => cellsKey(cells) === target,
	);
	const events: Array<PlaceEvent> = [];

	game.on("place", (event) => events.push(event));
	playAsUser(game, [...(play.mino === before.current ? [] : HOLD), ...(move?.keys ?? [])], player.handling);

	const [event] = events;

	if (!event) throw new Error("The play did not lock");

	return callLock(wellStage(stageId), null, { event, before, after: searchStateOf(game) }, JUDGE);
};

const judgeDev = (name: DevBoardName): Promise<WellsCall> => {
	const dev = DEV_BOARDS[name];

	return judgeOpening(dev.stage, devOpening(dev), dev.play);
};

const mistakeOf = (call: WellsCall) => (call.ok ? null : call.mistake);

describe("Column wells judge", () => {
	it.each([
		["well-blocked", "well-blocked"],
		["wrong-side", "wrong-side"],
		["hole", "hole"],
		["homeless", "homeless"],
		["slow-count", "slow-count"],
		["non-quad-clear", "non-quad-clear"],
		["over-ceiling", "over-ceiling"],
	] as const)("names %s and shows a passing placement", async (name, kind) => {
		const mistake = mistakeOf(await judgeDev(name));

		expect(mistake?.kind).toBe(kind);
		expect(mistake?.best).not.toBeNull();
		expect(mistake?.overlays?.some((overlay) => overlay.kind === "rowLine")).toBe(true);
	});

	it.each(MISTAKE_BOARDS)("shows a %s card's green placement that the judge passes", async (name) => {
		const dev = DEV_BOARDS[name];
		const best = mistakeOf(await judgeDev(name))?.best;

		if (!best) throw new Error(`The ${name} card has no green placement`);

		expect(await judgeOpening(dev.stage, devOpening(dev), best)).toMatchObject({ ok: true });
	});

	it("shows a green the judge passes for an S dropped in the well with a T next", async () => {
		const opening: WellsOpening = { board: [], queue: [Mino.S, Mino.T, Mino.O, Mino.I, Mino.J, Mino.L], seed: 1 };
		const best = mistakeOf(
			await judgeOpening("nine-zero", opening, { mino: Mino.S, orientation: "right", column: 8, row: 0 }),
		)?.best;

		expect(best === null || best === undefined ? null : await judgeOpening("nine-zero", opening, best)).toMatchObject(
			{
				ok: true,
			},
		);
	});

	it("offers no hold to a player who already held, nor a hold that brings up an app piece", async () => {
		const held = await judgeOpening(
			"nine-zero",
			{ board: [], queue: [Mino.O, Mino.S, Mino.T, Mino.I, Mino.J, Mino.L], seed: 1 },
			{ mino: Mino.S, orientation: "spawn", column: 0, row: 0 },
		);
		const owned = mistakeOf(
			await judgeOpening(
				"six-side",
				{ board: [], queue: [Mino.T, Mino.O, Mino.I, Mino.J, Mino.L, Mino.S], seed: 1 },
				{ mino: Mino.T, orientation: "reverse", column: 0, row: 0 },
			),
		);

		expect(held).toMatchObject({ ok: true });
		expect(owned).toMatchObject({ kind: "hole", detail: undefined, best: { mino: Mino.T } });
	});

	it("explains a hole the hold piece avoids, a homeless set and a slow count", async () => {
		expect(mistakeOf(await judgeDev("hole"))).toMatchObject({
			detail: "Hold for the O: it has a clean spot.",
			best: { mino: Mino.O },
		});
		expect(mistakeOf(await judgeDev("homeless"))?.detail).toBe("No clean spot left for L O J.");
		expect(mistakeOf(await judgeDev("slow-count"))?.detail).toBe("Best: ready with this piece. Yours: 1 more.");
	});

	it("passes a quad and the lock that makes a Convert board quad-ready", async () => {
		expect(await judgeDev("lines-pass")).toMatchObject({ ok: true, ready: true });
		expect(await judgeDev("convert-pass")).toMatchObject({ ok: true, ready: true });
	});

	it("passes a clean placement and a hole no piece in reach avoids", async () => {
		const flat: WellsOpening = { board: [], queue: [Mino.O, Mino.T, Mino.I, Mino.J, Mino.L, Mino.S], seed: 1 };
		const forced: WellsOpening = { board: [], queue: [Mino.S, Mino.Z, Mino.O, Mino.T, Mino.I, Mino.J], seed: 1 };

		expect(
			await judgeOpening("nine-zero", flat, { mino: Mino.O, orientation: "spawn", column: 0, row: 0 }),
		).toMatchObject({
			ok: true,
		});
		expect(
			await judgeOpening("nine-zero", forced, { mino: Mino.S, orientation: "spawn", column: 0, row: 0 }),
		).toMatchObject({ ok: true });
	});

	it("blocks the well with an I that clears nothing", async () => {
		const opening: WellsOpening = { board: [], queue: [Mino.I, Mino.O, Mino.T, Mino.J, Mino.L], seed: 1 };
		const call = await judgeOpening("nine-zero", opening, { mino: Mino.I, orientation: "right", column: 9, row: 0 });

		expect(mistakeOf(call)?.kind).toBe("well-blocked");
	});

	it("lets the well floor rise over a forced floor hole, then quads above it", async () => {
		const forced: ReadonlyArray<BoardItem> = [{ mino: Mino.S, orientation: "spawn", column: 0, row: 0 }];
		const raise: Placement = { mino: Mino.J, orientation: "spawn", column: 7, row: 0 };
		const raised = await judgeOpening(
			"nine-zero",
			{ board: forced, queue: [Mino.J, Mino.O, Mino.T, Mino.I, Mino.L, Mino.Z], seed: 1 },
			raise,
		);
		const quad = await judgeOpening(
			"nine-zero",
			{
				board: [
					{ column: 9, amount: 4 },
					{ column: 2, amount: 1 },
				],
				queue: [Mino.I, Mino.O, Mino.T, Mino.J, Mino.L, Mino.Z],
				seed: 1,
			},
			{ mino: Mino.I, orientation: "right", column: 9, row: 1 },
		);

		expect(raised).toMatchObject({ ok: true });
		expect(quad).toMatchObject({ ok: true, ready: true });
	});

	it("leaves a delegated stage 2 piece to the app and passes it", async () => {
		const opening: WellsOpening = { board: [], queue: [Mino.T, Mino.O, Mino.J, Mino.L, Mino.S, Mino.Z], seed: 1 };
		const drill: Drill<WellsState, WellStage> = {
			...WELLS_DRILL,
			start: (stage, seed) => ({ ...startWells(stage, seed), opening }),
		};
		const session = createMutableState(createDrillSession(drill));

		setStage(session, drill, JUDGE, wellStage("three-side"));

		expect(session.owner).toBe("demo");

		await settle();

		const placed: Array<PlaceEvent> = [];

		session.game.on("place", (event) => placed.push(event));

		for (let frame = 0; frame < FRAME_LIMIT && placed.length === 0; frame++) session.game.step();

		await settle();

		const [event] = placed;

		expect(event?.placement.mino).toBe(Mino.T);
		expect(event?.cells.some(([x]) => x === 6 || THREE_SIDE.includes(x))).toBe(false);
		expect(session.status).toBe("playing");
		expect(session.owner).toBe("user");
		expect(session.state.mistakes).toBe(0);
	});
});
