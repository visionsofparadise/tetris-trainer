import { Engine, legal, type EngineInitializeParams, type Mino } from "@haelp/teto/engine";
import type { Action, Handling } from "./config";

export type GameKey = Exclude<Action, "exit" | "retry">;

export type Block = [x: number, y: number];

export interface GameStats {
	pieces: number;
	lines: number;
	frames: number;
}

export const VISIBLE_ROWS = 20;

export const BOARD_COLUMNS = 10;

export const NEXT_COUNT = 5;

const createEngineOptions = (handling: Handling, seed: number): EngineInitializeParams => ({
	board: { width: BOARD_COLUMNS, height: VISIBLE_ROWS, buffer: 20 },
	kickTable: "SRS+",
	options: {
		comboTable: "multiplier",
		garbageBlocking: "combo blocking",
		clutch: true,
		garbageTargetBonus: "none",
		spinBonuses: "all-mini+",
		stock: 0,
	},
	queue: { minLength: 10, seed, type: "7-bag" },
	garbage: {
		bombs: false,
		cap: { absolute: 0, increase: 0, max: 40, value: 8, marginTime: 0 },
		boardWidth: BOARD_COLUMNS,
		garbage: { speed: 20, holeSize: 1 },
		messiness: { change: 1, nosame: false, timeout: 0, within: 0, center: false },
		multiplier: { value: 1, increase: 0, marginTime: 10800 },
		specialBonus: false,
		openerPhase: 0,
		seed,
		rounding: "down",
	},
	gravity: { value: 0.02, increase: 0, marginTime: 0 },
	handling,
	b2b: { chaining: true, charging: false },
	pc: { b2b: 0, garbage: 0 },
	misc: {
		allowed: { hardDrop: true, spin180: true, hold: true, retry: false, undo: false },
		infiniteHold: false,
		movement: { infinite: false, lockResets: 15, lockTime: 30, may20G: true },
		stride: false,
	},
});

export class Game {
	readonly #engine: Engine;
	#inputs: Parameters<Engine["tick"]>[0] = [];
	#isOver = false;

	constructor(handling: Handling, seed = Math.floor(Math.random() * 2 ** 31)) {
		this.#engine = new Engine(createEngineOptions(handling, seed));
		this.#engine.events.on("falling.lock", (lock) => {
			if (lock.topout) this.#isOver = true;
		});
	}

	get isOver(): boolean {
		return this.#isOver;
	}

	get board(): ReadonlyArray<ReadonlyArray<Mino | null>> {
		return this.#engine.board.state.map((row) => row.map((tile) => tile?.mino ?? null));
	}

	get falling(): { mino: Mino; blocks: Array<Block> } {
		const { falling } = this.#engine;

		return { mino: falling.symbol, blocks: falling.absoluteBlocks };
	}

	get ghost(): Array<Block> {
		const { falling, board } = this.#engine;
		let y = falling.y;

		while (legal(falling.absoluteAt({ y: y - 1 }), board.state)) y--;

		return falling.absoluteAt({ y });
	}

	get hold(): Mino | null {
		return this.#engine.held;
	}

	get next(): Array<Mino> {
		return this.#engine.queue.raw().slice(0, NEXT_COUNT);
	}

	get stats(): GameStats {
		const { stats, frame } = this.#engine;

		return { pieces: stats.pieces, lines: stats.lines, frames: frame };
	}

	press(key: GameKey): void {
		this.#input("keydown", key);
	}

	release(key: GameKey): void {
		this.#input("keyup", key);
	}

	tick(): void {
		if (this.#isOver) return;

		const inputs = this.#inputs;

		this.#inputs = [];
		this.#engine.tick(inputs);
	}

	#input(type: "keydown" | "keyup", key: GameKey): void {
		this.#inputs.push({ type, frame: this.#engine.frame, data: { key, subframe: 0 } });
	}
}
