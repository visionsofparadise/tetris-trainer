import { DEFAULT_CONFIG, dropSteps, Game, samePlacement } from "@tetris-trainer/game";
import type { GameSetup, Handling, Placement, ScriptStep } from "@tetris-trainer/game";

interface SequenceStep {
	readonly placement: Placement;
	readonly keys?: ReadonlyArray<ScriptStep>;
}

export interface SequenceLesson {
	readonly name: string;
	readonly instructions: string;
	readonly steps: ReadonlyArray<SequenceStep>;
}

export interface ScriptPacing {
	readonly keyWait: number;
	readonly pieceWait: number;
}

export type AttemptResult = "success" | "fail";

const DEMO_HANDLING: Handling = { ...DEFAULT_CONFIG.handling, sdf: 41 };
const DEMO_PACING: ScriptPacing = { keyWait: 6, pieceWait: 30 };

const setupFor = ({ steps }: SequenceLesson): GameSetup => ({
	board: [],
	validate: true,
	queue: { pieces: steps.map(({ placement }) => placement.mino), mode: "fresh-bag" },
	holdEnabled: false,
});

export const lessonScript = ({ steps }: SequenceLesson, { keyWait, pieceWait }: ScriptPacing): Array<ScriptStep> =>
	steps.flatMap(({ placement, keys = dropSteps(placement) }) =>
		keys.map((key, index) => ({ ...key, wait: index === 0 ? pieceWait : keyWait })),
	);

export const startPreview = (lesson: SequenceLesson): Game => {
	const game = new Game(DEMO_HANDLING);

	game.load(setupFor(lesson));
	game.pause();

	return game;
};

export const startDemo = (lesson: SequenceLesson, onDone: () => void): Game => {
	const game = new Game(DEMO_HANDLING);
	let placed = 0;

	game.load(setupFor(lesson));
	game.setUserInput(false);
	game.input(lessonScript(lesson, DEMO_PACING));
	game.on("place", () => {
		placed++;

		if (placed !== lesson.steps.length) return;

		game.pause();
		onDone();
	});

	return game;
};

export const startAttempt = (
	lesson: SequenceLesson,
	handling: Handling,
	onResult: (result: AttemptResult) => void,
): Game => {
	const game = new Game(handling);
	let placed = 0;
	let isFinished = false;

	const finish = (result: AttemptResult) => {
		if (isFinished) return;

		isFinished = true;
		game.pause();
		onResult(result);
	};

	game.load(setupFor(lesson));
	game.on("place", ({ placement }) => {
		const expected = lesson.steps[placed];

		if (expected === undefined || !samePlacement(placement, expected.placement)) {
			finish("fail");

			return;
		}

		placed++;

		if (placed === lesson.steps.length) finish("success");
	});
	game.on("topout", () => finish("fail"));

	return game;
};
