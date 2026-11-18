import { DEFAULT_CONFIG, type PlaceEvent, type ScriptStep } from "@tetris-trainer/game";
import { createMutableState } from "opshot";
import { describe, expect, it } from "vitest";
import { createLocalSearch } from "../../search/localSearch";
import { createDrillWatch, dealDrillWatch } from "../drill/drillWatch";
import { createDrillSession, retryDrill, setStage, type DrillSession } from "../drill/drillSession";
import { playerOf } from "../drill/player";
import { meetsGoal } from "./goal";
import { landingOf } from "./judge";
import { targetDrill, type TargetStage, type TargetState } from "./targetDrill";
import type { JudgeContext } from "../drill/Drill";

const PLAYER = playerOf(DEFAULT_CONFIG);

const JUDGE: JudgeContext = { player: PLAYER, search: createLocalSearch() };

const FRAME_LIMIT = 900;

const SPIN: TargetStage = {
	id: "spin",
	title: "Spin",
	goal: "Spin.",
	onMistake: "pause",
	families: ["tsd"],
	streak: 2,
};

const SLIDE: TargetStage = {
	id: "slide",
	title: "Slide",
	goal: "Slide.",
	onMistake: "pause",
	families: ["tuck"],
	streak: 2,
};

const STAGES: ReadonlyArray<TargetStage> = [SPIN, SLIDE];

const DRILL = targetDrill({ stages: STAGES, watch: ["tsd", "tuck"] });

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

interface Described {
	readonly pass: ReadonlyArray<ScriptStep>;
	readonly miss: ReadonlyArray<ScriptStep>;
}

const described = (session: DrillSession<TargetState, TargetStage>): Described =>
	JSON.parse(DRILL.describe(session.state, PLAYER)) as Described;

const lockKeys = async (session: DrillSession<TargetState, TargetStage>, keys: ReadonlyArray<ScriptStep>) => {
	const { game } = session;
	let placed = false;

	game.on("place", () => (placed = true));
	game.input(keys);

	for (let frame = 0; frame < FRAME_LIMIT && !placed; frame++) game.step();

	await settle();
};

const started = (stage: TargetStage): DrillSession<TargetState, TargetStage> => {
	const session = createMutableState(createDrillSession(DRILL));

	setStage(session, DRILL, JUDGE, stage);

	return session;
};

describe("target drill", () => {
	it.each(STAGES.map((stage) => [stage.id, stage] as const))(
		"passes the %s goal, deals a new board, and passes the stage after its streak",
		async (_, stage) => {
			const session = started(stage);
			const first = session.state.round;

			await lockKeys(session, described(session).pass);

			expect(session.status).toBe("playing");
			expect(session.state.streak).toBe(1);
			expect(session.state.round).not.toEqual(first);

			await lockKeys(session, described(session).pass);

			expect(session.passed).toEqual([stage.id]);
		},
	);

	it("deals a different board each round, also after a seed the generator skips", () => {
		let state = DRILL.start(SLIDE, 12345);
		const seen = [state.round.rows.join("/")];

		for (let round = 0; round < 40; round++) {
			state = DRILL.deal(state, PLAYER, "next").state;
			seen.push(state.round.rows.join("/"));
		}

		expect(seen.filter((rows, index) => rows === seen[index - 1])).toEqual([]);
	});

	it("shows a mistake card for a missed goal, and a retry deals the same board from its spawn", async () => {
		const session = started(SPIN);
		const { round } = session.state;

		await lockKeys(session, described(session).pass);
		await lockKeys(session, described(session).miss);

		expect(session.status).toBe("mistake");
		expect(session.mistake?.placed).not.toBeNull();
		expect(session.state.streak).toBe(0);

		const missed = session.state.round;

		retryDrill(session, DRILL, JUDGE);

		expect(session.status).toBe("playing");
		expect(session.state.round).toBe(missed);
		expect(missed).not.toBe(round);
	});

	it("plays a passing move in Watch", async () => {
		const watch = createDrillWatch();
		const deal = DRILL.watch;
		let placed: PlaceEvent | null = null;

		if (!deal) throw new Error("The drill has no Watch");

		dealDrillWatch(watch, deal, JUDGE);
		watch.game.on("place", (event) => (placed = event));
		await settle();

		for (let frame = 0; frame < FRAME_LIMIT && placed === null; frame++) watch.game.step();

		if (placed === null) throw new Error("The Watch piece never locked");

		expect(watch.narration[0]).toBe("T-spin double");
		expect(meetsGoal({ kind: "spin", spin: "normal", lines: 2 }, landingOf(placed))).toBe(true);
	});
});
