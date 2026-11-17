import { BOARD_COLUMNS } from "./engineOptions";
import type { Action, Handling } from "./config";

export type GameKey = Exclude<Action, "exit" | "retry">;

export type InputType = "keydown" | "keyup";

export type ShiftKey = Extract<GameKey, "moveLeft" | "moveRight">;

export const SHIFT_KEYS: ReadonlyArray<ShiftKey> = ["moveLeft", "moveRight"];

export const QUARTER_TURN_KEYS: ReadonlyArray<GameKey> = ["rotateCW", "rotateCCW"];

export const ROTATION_KEYS: ReadonlyArray<GameKey> = [...QUARTER_TURN_KEYS, "rotate180"];

interface Wait {
	readonly wait?: number;
}

export type ScriptStep = Wait &
	(
		| { readonly tap: GameKey }
		| { readonly hold: GameKey; readonly frames: number }
		| { readonly das: ShiftKey }
		| { readonly press: GameKey }
		| { readonly release: GameKey }
	);

export interface InputFrame {
	readonly frame: number;
	readonly type: InputType;
	readonly key: GameKey;
}

const dasFrames = ({ das, arr: autoRepeatRate }: Handling): number =>
	Math.ceil(das + autoRepeatRate * (BOARD_COLUMNS - 1)) + 1;

const held = (key: GameKey, frame: number, frames: number): Array<InputFrame> => [
	{ frame, type: "keydown", key },
	{ frame: frame + frames, type: "keyup", key },
];

const stepInputs = (step: ScriptStep, frame: number, handling: Handling): Array<InputFrame> => {
	if ("tap" in step) return held(step.tap, frame, 1);

	if ("hold" in step) return held(step.hold, frame, step.frames);

	if ("das" in step) return held(step.das, frame, dasFrames(handling));

	if ("press" in step) return [{ frame, type: "keydown", key: step.press }];

	return [{ frame, type: "keyup", key: step.release }];
};

export const compileScript = (steps: ReadonlyArray<ScriptStep>, handling: Handling): Array<InputFrame> => {
	const inputs: Array<InputFrame> = [];
	let frame = 0;

	for (const step of steps) {
		frame += step.wait ?? 0;

		const stepFrames = stepInputs(step, frame, handling);

		inputs.push(...stepFrames);
		frame = Math.max(...stepFrames.map((input) => input.frame)) + 1;
	}

	return inputs;
};
