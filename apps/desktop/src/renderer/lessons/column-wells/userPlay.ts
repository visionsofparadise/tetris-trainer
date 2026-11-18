import {
	BOARD_COLUMNS,
	type Game,
	type GameKey,
	type Handling,
	type PlaceEvent,
	type ScriptStep,
} from "@tetris-trainer/game";

interface KeyEvent {
	readonly frame: number;
	readonly key: GameKey;
	readonly down: boolean;
}

const FRAME_LIMIT = 600;

const heldFrames = (step: ScriptStep, { das, arr: autoRepeatRate }: Handling): number => {
	if ("hold" in step) return step.frames;

	if ("das" in step) return Math.ceil(das + autoRepeatRate * (BOARD_COLUMNS - 1)) + 1;

	return 1;
};

const keyOf = (step: ScriptStep): GameKey => {
	if ("tap" in step) return step.tap;

	if ("hold" in step) return step.hold;

	if ("das" in step) return step.das;

	return "press" in step ? step.press : step.release;
};

const keyEvents = (steps: ReadonlyArray<ScriptStep>, handling: Handling): Array<KeyEvent> => {
	const events: Array<KeyEvent> = [];
	let frame = 0;

	for (const step of steps) {
		frame += step.wait ?? 0;

		const key = keyOf(step);
		const up = frame + heldFrames(step, handling);

		events.push({ frame, key, down: true }, { frame: up, key, down: false });
		frame = up + 1;
	}

	return events;
};

export const playAsUser = (game: Game, steps: ReadonlyArray<ScriptStep>, handling: Handling): boolean => {
	const events = keyEvents(steps, handling);
	const held = new Set<GameKey>();
	const placed: Array<PlaceEvent> = [];
	const off = game.on("place", (event) => placed.push(event));

	for (let frame = 0; frame < FRAME_LIMIT && placed.length === 0 && !game.isOver; frame++) {
		for (const { key, down } of events.filter((event) => event.frame === frame)) {
			if (down) game.press(key);
			else game.release(key);

			if (down) held.add(key);
			else held.delete(key);
		}

		game.step();
	}

	off();
	held.forEach((key) => game.release(key));

	return placed.length > 0;
};
