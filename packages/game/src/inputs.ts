import type { Handling } from "./config";
import type { FinesseOptions } from "./finesse";
import type { GameKey, InputType, ScriptStep, ShiftKey } from "./script";

export interface KeyPress {
	readonly key: GameKey;
	readonly source: "user" | "script";
	readonly down: number;
	readonly up: number;
	readonly blocked: boolean;
}

export interface RecordedInput {
	readonly frame: number;
	readonly type: InputType;
	readonly key: GameKey;
	readonly source: KeyPress["source"];
	readonly blocked: boolean;
}

type Opened = Omit<KeyPress, "up"> & { readonly up?: number };

const SHIFT_KEYS: ReadonlyArray<GameKey> = ["moveLeft", "moveRight"];

const ROTATION_KEYS: ReadonlyArray<GameKey> = ["rotateCW", "rotateCCW", "rotate180"];

const PAIRED_ROTATIONS: ReadonlyArray<GameKey> = ["rotateCW", "rotateCCW"];

export const isShiftKey = (key: GameKey): key is ShiftKey => SHIFT_KEYS.includes(key);

const isTurnKey = (key: GameKey): boolean => isShiftKey(key) || ROTATION_KEYS.includes(key);

const openPresses = (inputs: ReadonlyArray<RecordedInput>, spawn: number): Array<Opened> => {
	const presses: Array<Opened> = [];

	for (const { frame, type, key, source, blocked } of inputs) {
		const open = presses.filter((press) => press.key === key && press.up === undefined).at(-1);

		if (type === "keydown") presses.push({ key, source, down: frame - spawn, blocked: false });
		else if (open !== undefined) presses[presses.indexOf(open)] = { ...open, up: frame - spawn, blocked };
	}

	return presses;
};

export class KeyRecord {
	#spawn = 0;
	#inputs: Array<RecordedInput> = [];
	#held: Array<Pick<KeyPress, "key" | "source">> = [];

	reset(frame: number): void {
		this.#spawn = frame;
		this.#inputs = [];
		this.#held = [];
	}

	add(input: RecordedInput): void {
		this.#inputs.push(input);
	}

	start(frame: number): void {
		const carried = this.#held.map(({ key, source }): RecordedInput => ({
			frame,
			type: "keydown",
			key,
			source,
			blocked: false,
		}));

		this.#spawn = frame;
		this.#inputs = [...carried, ...this.#inputs];
		this.#held = [];
	}

	take(frame: number, isBlocked: (key: ShiftKey) => boolean): Array<KeyPress> {
		const drop = this.#inputs.findIndex(
			(input) => input.frame === frame && input.type === "keydown" && input.key === "hardDrop",
		);
		const end = drop === -1 ? this.#inputs.length : drop + 1;
		const presses = openPresses(this.#inputs.slice(0, end), this.#spawn);

		this.#inputs = this.#inputs.slice(end);
		this.#held = presses.filter((press) => press.up === undefined && isTurnKey(press.key));

		return presses.map(({ up, ...press }) =>
			up === undefined
				? { ...press, up: frame - this.#spawn, blocked: isShiftKey(press.key) && isBlocked(press.key) }
				: { ...press, up },
		);
	}
}

const userTurns = (presses: ReadonlyArray<KeyPress>): Array<KeyPress> =>
	presses
		.filter((press) => press.source === "user" && isTurnKey(press.key))
		.sort((first, second) => first.down - second.down);

export const isDasPress = (press: KeyPress, handling: Handling): boolean =>
	isShiftKey(press.key) && press.up - press.down >= handling.das;

export const pressesToSteps = (presses: ReadonlyArray<KeyPress>, handling: Handling): Array<ScriptStep> =>
	userTurns(presses).map((press) => {
		const { key } = press;

		return isShiftKey(key) && isDasPress(press, handling) ? { das: key } : { tap: key };
	});

export const playerPresses = (presses: ReadonlyArray<KeyPress>, { allow180 }: FinesseOptions): number =>
	userTurns(presses).reduce<{ readonly count: number; readonly unpaired: GameKey | null }>(
		({ count, unpaired }, { key }) =>
			allow180 && key === unpaired
				? { count, unpaired: null }
				: { count: count + 1, unpaired: PAIRED_ROTATIONS.includes(key) ? key : null },
		{ count: 0, unpaired: null },
	).count;
