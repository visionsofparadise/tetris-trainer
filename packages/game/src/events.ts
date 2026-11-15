import type { Block, Placement } from "./pieces";
import type { GameKey, InputType } from "./script";
import type { Mino, SpinType } from "@haelp/teto/engine";

export interface SpawnEvent {
	readonly mino: Mino;
	readonly fromHold: boolean;
}

export interface HoldEvent {
	readonly mino: Mino;
}

export interface PlaceEvent {
	readonly placement: Placement;
	readonly cells: ReadonlyArray<Block>;
	readonly lines: number;
	readonly spin: SpinType;
	readonly combo: number;
	readonly b2b: number;
	readonly attack: number;
	readonly isPerfectClear: boolean;
}

export interface InputEvent {
	readonly type: InputType;
	readonly key: GameKey;
	readonly source: "user" | "script";
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- mitt requires a type alias, which carries an implicit index signature.
export type GameEvents = {
	spawn: SpawnEvent;
	hold: HoldEvent;
	place: PlaceEvent;
	input: InputEvent;
	topout: undefined;
};
