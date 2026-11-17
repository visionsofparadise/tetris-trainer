import { legal, type Engine, type EngineInitializeParams } from "@haelp/teto/engine";
import type { Handling } from "./config";

export const VISIBLE_ROWS = 20;

export const BOARD_COLUMNS = 10;

export const BOARD_SIZE = { width: BOARD_COLUMNS, height: VISIBLE_ROWS, buffer: 20 };

export const DEFAULT_GRAVITY = 0.02;

const SPAWN_SETTLE = 1e-6;

export const settleSpawn = (engine: Engine): void => {
	const { falling, board } = engine;
	const row = falling.y;

	if (!legal(falling.absoluteAt({ y: row - 1 }), board.state)) return;

	falling.location[1] = row - SPAWN_SETTLE;
	falling.highestY = row - 1;
};

export const createEngineOptions = (handling: Handling, seed: number): EngineInitializeParams => ({
	board: BOARD_SIZE,
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
	gravity: { value: DEFAULT_GRAVITY, increase: 0, marginTime: 0 },
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
