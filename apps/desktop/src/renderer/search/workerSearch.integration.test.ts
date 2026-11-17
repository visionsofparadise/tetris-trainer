import { DEFAULT_CONFIG, LIVE_BUDGET, Mino, simBoardOf, type MoveRules, type SearchState } from "@tetris-trainer/game";
import { describe, expect, it } from "vitest";
import { searchClientOn } from "./workerSearch";

class SilentWorker extends EventTarget {
	postMessage(): void {}
}

const TIMEOUT_MS = 20;

const RULES: MoveRules = { allow180: true, excluded: {}, holeFreeOnly: true, ceiling: null, quadClearsOnly: true };

const MOVER = { handling: DEFAULT_CONFIG.handling, gravity: 0 };

const STATE: SearchState = {
	board: simBoardOf([]),
	current: Mino.I,
	hold: null,
	holdEnabled: true,
	holdLocked: false,
	queue: [Mino.O],
};

describe("searchClientOn", () => {
	it("resolves a search to unknown and a fit check to no results when the worker does not answer in time", async () => {
		const client = searchClientOn(new SilentWorker(), TIMEOUT_MS);

		await expect(client.quadReady(STATE, { well: 9 }, RULES, MOVER, LIVE_BUDGET)).resolves.toEqual({
			kind: "unknown",
			nodes: 0,
		});
		await expect(client.fitAfter(STATE.board, Mino.T, [Mino.O], RULES, MOVER)).resolves.toEqual([]);
	});

	it("rejects pending and later calls once the worker reports an error", async () => {
		const worker = new SilentWorker();
		const client = searchClientOn(worker, TIMEOUT_MS);
		const pending = client.quadReady(STATE, { well: 9 }, RULES, MOVER, LIVE_BUDGET);

		worker.dispatchEvent(new Event("error"));

		await expect(pending).rejects.toThrow("The search worker raised error");
		await expect(client.fitAfter(STATE.board, Mino.T, [Mino.O], RULES, MOVER)).rejects.toThrow(
			"The search worker raised error",
		);
	});
});
