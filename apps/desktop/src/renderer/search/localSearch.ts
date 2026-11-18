import { fitAfter, searchQuadReady } from "@tetris-trainer/game";
import type { SearchClient } from "./SearchClient";

export const createLocalSearch = (): SearchClient => ({
	quadReady: (state, goal, rules, mover, budget) =>
		Promise.resolve(searchQuadReady(state, goal, rules, mover, budget)),
	fitAfter: (board, mino, pieces, rules, mover) => Promise.resolve(fitAfter(board, mino, pieces, rules, mover)),
});
