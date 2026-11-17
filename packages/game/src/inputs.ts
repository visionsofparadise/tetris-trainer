import {
	QUARTER_TURN_KEYS,
	ROTATION_KEYS,
	SHIFT_KEYS,
	type GameKey,
	type InputType,
	type ScriptStep,
	type ShiftKey,
} from "./script";
import type { Handling } from "./config";
import type { FinesseOptions } from "./finesse";

export interface KeyPress {
	readonly key: GameKey;
	readonly source: "user" | "script";
	readonly down: number;
	readonly up: number;
	readonly blocked: boolean;
	readonly carried: boolean;
}

export interface RecordedInput {
	readonly frame: number;
	readonly type: InputType;
	readonly key: GameKey;
	readonly source: KeyPress["source"];
	readonly blocked: boolean;
	readonly carried: boolean;
}

type Opened = Omit<KeyPress, "up"> & { readonly up?: number };

const isShiftKey = (key: GameKey): key is ShiftKey => SHIFT_KEYS.some((shift) => shift === key);

const isTurnKey = (key: GameKey): boolean => isShiftKey(key) || ROTATION_KEYS.includes(key);

const openPresses = (inputs: ReadonlyArray<RecordedInput>, spawn: number): Array<Opened> => {
	const presses: Array<Opened> = [];

	for (const { frame, type, key, source, blocked, carried } of inputs) {
		const open = presses.filter((press) => press.key === key && press.up === undefined).at(-1);

		if (type === "keydown") presses.push({ key, source, down: frame - spawn, blocked, carried });
		else if (open !== undefined) presses[presses.indexOf(open)] = { ...open, up: frame - spawn };
	}

	return presses;
};

export class KeyRecord {
	#spawn = 0;
	#inputs: Array<RecordedInput> = [];
	#held: Array<Pick<KeyPress, "source"> & { readonly key: ShiftKey }> = [];

	reset(frame: number): void {
		this.#spawn = frame;
		this.#inputs = [];
		this.#held = [];
	}

	add(input: RecordedInput): void {
		this.#inputs.push(input);
	}

	markBlocked(isBlocked: (key: ShiftKey) => boolean): void {
		const open = new Map<GameKey, number>();

		this.#inputs.forEach(({ type, key }, index) => (type === "keydown" ? open.set(key, index) : open.delete(key)));

		for (const index of open.values()) {
			const input = this.#inputs[index];

			if (input !== undefined && !input.blocked && isShiftKey(input.key) && isBlocked(input.key))
				this.#inputs[index] = { ...input, blocked: true };
		}
	}

	start(frame: number, isCharged: (key: ShiftKey) => boolean): void {
		const carried = this.#held
			.filter(({ key }) => isCharged(key))
			.map(({ key, source }): RecordedInput => ({
				frame,
				type: "keydown",
				key,
				source,
				blocked: false,
				carried: true,
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
		this.#held = presses.flatMap(({ key, source, up }) =>
			up === undefined && isShiftKey(key) ? [{ key, source }] : [],
		);

		return presses.map(({ up, ...press }) =>
			up === undefined
				? {
						...press,
						up: frame - this.#spawn,
						blocked: press.blocked || (isShiftKey(press.key) && isBlocked(press.key)),
					}
				: { ...press, up },
		);
	}
}

const userTurns = (presses: ReadonlyArray<KeyPress>): Array<KeyPress> =>
	presses
		.filter((press) => press.source === "user" && !press.carried && isTurnKey(press.key))
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
				: { count: count + 1, unpaired: QUARTER_TURN_KEYS.includes(key) ? key : null },
		{ count: 0, unpaired: null },
	).count;
