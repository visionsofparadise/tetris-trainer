import { DEFAULT_CONFIG, LIVE_BUDGET, searchQuadReady } from "@tetris-trainer/game";
import { createMutableState } from "opshot";
import { describe, expect, it } from "vitest";
import { createLocalSearch } from "../../search/localSearch";
import { searchStateOf } from "../../search/searchStateOf";
import { continueDrill, createDrillSession, setStage, type DrillSession } from "../drill/drillSession";
import { createDrillWatch, dealDrillWatch } from "../drill/drillWatch";
import { playerOf } from "../drill/player";
import { loadSlide } from "../opener/openerScript";
import { DEV_BOARDS, devKeys, devOpening, type DevBoardName } from "./devBoards";
import { chooseMove, choiceKeys } from "./policy";
import { goalOf, moverOf, wellsRules } from "./rules";
import { WELLS_SLIDES } from "./slides";
import { wellStage, type WellStage, type WellStageId } from "./stages";
import { playAsUser } from "./userPlay";
import { startWells, WELLS_DRILL, type WellsState } from "./wellsDrill";
import { wellsWatch } from "./watch";
import type { Drill, JudgeContext } from "../drill/Drill";

const JUDGE: JudgeContext = { player: playerOf(DEFAULT_CONFIG), search: createLocalSearch() };

const RULE_KINDS = ["well-blocked", "wrong-side", "non-quad-clear"];

const WATCH_LOCKS = 5;

const FRAME_LIMIT = 20000;

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

type WellsSession = DrillSession<WellsState, WellStage>;

const sessionOn = (stageId: WellStageId, drill: Drill<WellsState, WellStage> = WELLS_DRILL): WellsSession => {
	const session = createMutableState(createDrillSession(drill));

	setStage(session, drill, JUDGE, wellStage(stageId));

	return session;
};

const devSession = (name: DevBoardName): WellsSession => {
	const dev = DEV_BOARDS[name];
	const opening = devOpening(dev);
	const session = sessionOn(dev.stage, {
		...WELLS_DRILL,
		start: (stage, seed) => ({ ...startWells(stage, seed), opening }),
	});

	playAsUser(session.game, devKeys(dev, opening, JUDGE.player), JUDGE.player.handling);

	return session;
};

const policyLock = async (session: WellsSession): Promise<void> => {
	const { stage } = session.state;
	const spawn = searchStateOf(session.game);
	const rules = wellsRules(stage, true);
	const mover = moverOf(JUDGE.player);
	const before = searchQuadReady(spawn, goalOf(stage), rules, mover, { ...LIVE_BUDGET, deadlineMs: null });

	playAsUser(session.game, choiceKeys(chooseMove(spawn, before, stage, rules, mover, false)), JUDGE.player.handling);
	await settle();
};

describe("Column wells lesson", () => {
	it("plays ten 9-0 locks by the policy without a rule mistake", async () => {
		const session = sessionOn("nine-zero");
		const kinds: Array<string> = [];

		for (let lock = 0; lock < 10; lock++) {
			await policyLock(session);

			if (session.mistake) {
				kinds.push(session.mistake.kind);
				continueDrill(session, WELLS_DRILL, JUDGE);
			}
		}

		expect(kinds.filter((kind) => RULE_KINDS.includes(kind))).toEqual([]);
	});

	it("restarts the run after a mistake in a restart stage", async () => {
		const session = devSession("well-blocked");

		await settle();

		expect(session.mistake?.kind).toBe("well-blocked");

		continueDrill(session, WELLS_DRILL, JUDGE);

		expect(session.status).toBe("playing");
		expect(session.state).toMatchObject({ lines: 0, mistakes: 0 });
		expect(searchStateOf(session.game).board.rows.every((row) => row === 0)).toBe(true);
	});

	it("resumes after the failed lock in a pause stage, the mistake counted", async () => {
		const session = devSession("non-quad-clear");

		await settle();

		expect(session.mistake?.kind).toBe("non-quad-clear");

		const placed = session.game.snapshot();

		continueDrill(session, WELLS_DRILL, JUDGE);

		expect(session.status).toBe("playing");
		expect(session.state.mistakes).toBe(1);
		expect(session.game.snapshot().engine.board).toEqual(placed.engine.board);
	});

	it("plays a Watch round and narrates each piece's side", async () => {
		const session = createDrillWatch();

		dealDrillWatch(
			session,
			(player, search, round) => ({ ...wellsWatch(player, search, round), locks: WATCH_LOCKS }),
			JUDGE,
		);

		for (let frame = 0; frame < FRAME_LIMIT && !session.isDone; frame++) {
			session.game.step();
			await settle();
		}

		expect(session.isDone).toBe(true);
		expect(session.narration).toHaveLength(WATCH_LOCKS);
		expect(session.narration.every((line) => /^(Stack|Beside the well|Quad): [IJLOSTZ]$/.test(line))).toBe(true);
	});

	it.each(WELLS_SLIDES.map((slide) => [slide.title, slide] as const))("loads the %s slide", (_, slide) => {
		expect(() => loadSlide(slide)).not.toThrow();
	});
});
