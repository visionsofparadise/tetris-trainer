import { DEFAULT_CONFIG, samePlacement, type Game, type PlaceEvent } from "@tetris-trainer/game";
import { describe, expect, it, vi } from "vitest";
import { lessonScript, startAttempt, startDemo, type SequenceLesson } from "./sequenceLesson";
import { TKI_OPENER } from "./tkiOpener";

const LESSONS: ReadonlyArray<SequenceLesson> = [TKI_OPENER];
const INSTANT_SOFT_DROP = { ...DEFAULT_CONFIG.handling, sdf: 41 };
const MAX_FRAMES = 2000;

const playUntilPaused = (game: Game): void => {
	for (let frame = 0; frame < MAX_FRAMES && !game.isPaused; frame++) game.step();
};

describe("sequence lessons", () => {
	it.each(LESSONS.map((lesson) => [lesson.name, lesson] as const))(
		"demonstrates %s with every piece landing on its step",
		(_name, lesson) => {
			const onDone = vi.fn();
			const game = startDemo(lesson, onDone);
			const placed: Array<PlaceEvent> = [];

			game.on("place", (event) => placed.push(event));

			playUntilPaused(game);

			expect(onDone).toHaveBeenCalledOnce();
			expect(placed.map(({ placement }, index) => samePlacement(placement, lesson.steps[index]!.placement))).toEqual(
				lesson.steps.map(() => true),
			);
		},
	);

	it("ends the TKI opener on a T-spin double", () => {
		const game = startDemo(TKI_OPENER, vi.fn());
		let last: PlaceEvent | undefined;

		game.on("place", (event) => (last = event));

		playUntilPaused(game);

		expect(last?.spin).toBe("normal");
		expect(last?.lines).toBe(2);
	});

	it("fails an attempt on the first wrong placement and succeeds on the full sequence", () => {
		const onFail = vi.fn();
		const failing = startAttempt(TKI_OPENER, INSTANT_SOFT_DROP, onFail);

		failing.input([{ tap: "hardDrop" }]);
		failing.step(10);

		const onSuccess = vi.fn();
		const succeeding = startAttempt(TKI_OPENER, INSTANT_SOFT_DROP, onSuccess);

		succeeding.input(lessonScript(TKI_OPENER, { keyWait: 0, pieceWait: 0 }));
		playUntilPaused(succeeding);

		expect(onFail).toHaveBeenCalledExactlyOnceWith("fail");
		expect(onSuccess).toHaveBeenCalledExactlyOnceWith("success");
	});
});
