import { DEFAULT_CONFIG, Game, placementCells, taps } from "@tetris-trainer/game";
import type { Block, GameKey, GameSetup, Handling, Placement } from "@tetris-trainer/game";

interface SequenceStep {
	readonly placement: Placement;
	readonly keys: ReadonlyArray<GameKey>;
}

export interface SequenceLesson {
	readonly name: string;
	readonly instructions: string;
	readonly steps: ReadonlyArray<SequenceStep>;
}

export type AttemptResult = "success" | "fail";

const DEMO_HANDLING: Handling = { ...DEFAULT_CONFIG.handling, sdf: 41 };
const DEMO_GAP_FRAMES = 8;
const DEMO_PAUSE_FRAMES = 30;

const setupFor = ({ steps }: SequenceLesson): GameSetup => ({
	board: [],
	validate: true,
	queue: { pieces: steps.map(({ placement }) => placement.mino), mode: "fresh-bag" },
	holdEnabled: false,
});

const cellsKey = (cells: ReadonlyArray<Block>): string =>
	cells
		.map(([x, y]) => `${x},${y}`)
		.sort()
		.join(" ");

export const fillsPlacement = (cells: ReadonlyArray<Block>, placement: Placement): boolean =>
	cellsKey(cells) === cellsKey(placementCells(placement));

export const startPreview = (lesson: SequenceLesson): Game => {
	const game = new Game(DEMO_HANDLING);

	game.load(setupFor(lesson));
	game.pause();

	return game;
};

export const startDemo = (lesson: SequenceLesson, onDone: () => void): Game => {
	const game = new Game(DEMO_HANDLING);
	let startFrame = DEMO_PAUSE_FRAMES;
	let placed = 0;

	game.load(setupFor(lesson));
	game.setUserInput(false);

	for (const { keys } of lesson.steps) {
		const offset = startFrame;

		game.input(
			taps(keys, { gapFrames: DEMO_GAP_FRAMES }).map((input) => ({ ...input, frame: input.frame + offset })),
		);
		startFrame += keys.length * DEMO_GAP_FRAMES + DEMO_PAUSE_FRAMES;
	}

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
	game.on("place", ({ cells }) => {
		const expected = lesson.steps[placed];

		if (expected === undefined || !fillsPlacement(cells, expected.placement)) {
			finish("fail");

			return;
		}

		placed++;

		if (placed === lesson.steps.length) finish("success");
	});
	game.on("topout", () => finish("fail"));

	return game;
};
