import type { Action } from "./config";

export type GameKey = Exclude<Action, "exit" | "retry">;

export type InputType = "keydown" | "keyup";

export interface InputFrame {
	readonly frame: number;
	readonly type: InputType;
	readonly key: GameKey;
}

export interface TapOptions {
	readonly gapFrames: number;
}

export const taps = (keys: ReadonlyArray<GameKey>, { gapFrames }: TapOptions): Array<InputFrame> =>
	keys.flatMap((key, index) => [
		{ frame: index * gapFrames, type: "keydown", key },
		{ frame: index * gapFrames + 1, type: "keyup", key },
	]);
