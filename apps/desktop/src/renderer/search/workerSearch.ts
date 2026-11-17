import { wrap } from "comlink";
import type { SearchClient } from "./SearchClient";
import type { WorkerSearches } from "./searchWorker";

export const createWorkerSearch = (): SearchClient => {
	const searches = wrap<WorkerSearches>(
		new Worker(new URL("./searchWorker.ts", import.meta.url), { type: "module", name: "searchWorker" }),
	);

	return {
		quadReady: (state, goal, rules, mover, budget) => searches.quadReady(state, goal, rules, mover, budget),
		fitAfter: (board, mino, pieces, rules, mover) => searches.fitAfter(board, mino, pieces, rules, mover),
	};
};
