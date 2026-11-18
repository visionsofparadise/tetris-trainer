import { wrap, type Endpoint } from "comlink";
import type { SearchClient } from "./SearchClient";
import type { WorkerSearches } from "./searchWorker";
import type { FitResult, SearchResult } from "@tetris-trainer/game";

const CALL_TIMEOUT_MS = 1000;

const failureOf = (event: Event): Error => {
	const message = "message" in event && typeof event.message === "string" ? `: ${event.message}` : "";

	return new Error(`The search worker raised ${event.type}${message}`);
};

const errorOf = (reason: unknown): Error => (reason instanceof Error ? reason : new Error(String(reason)));

const answerless = <T>(error: Error, fallback: T): T => {
	console.error("The search worker failed, so the search makes no call", error);

	return fallback;
};

export const searchClientOn = (endpoint: Endpoint, timeoutMs: number): SearchClient => {
	const searches = wrap<WorkerSearches>(endpoint);
	const pending = new Set<(error: Error) => void>();
	let failure: Error | null = null;

	const fail = (event: Event): void => {
		const error = failureOf(event);

		failure = error;
		pending.forEach((answer) => answer(error));
		pending.clear();
	};

	endpoint.addEventListener("error", fail);
	endpoint.addEventListener("messageerror", fail);

	const settle = <T>(call: () => Promise<T>, fallback: T): Promise<T> => {
		if (failure) return Promise.resolve(answerless(failure, fallback));

		return new Promise<T>((resolve) => {
			const finish = (): void => {
				clearTimeout(timer);
				pending.delete(answer);
			};
			const answer = (error: Error): void => {
				finish();
				resolve(answerless(error, fallback));
			};
			const timer = setTimeout(() => {
				finish();
				resolve(fallback);
			}, timeoutMs);

			pending.add(answer);
			call().then(
				(value) => {
					finish();
					resolve(value);
				},
				(reason: unknown) => answer(errorOf(reason)),
			);
		});
	};

	return {
		quadReady: (state, goal, rules, mover, budget) =>
			settle<SearchResult>(() => searches.quadReady(state, goal, rules, mover, budget), {
				kind: "unknown",
				nodes: 0,
			}),
		fitAfter: (board, mino, pieces, rules, mover) =>
			settle<Array<FitResult>>(() => searches.fitAfter(board, mino, pieces, rules, mover), []),
	};
};

export const createWorkerSearch = (): SearchClient =>
	searchClientOn(
		new Worker(new URL("./searchWorker.ts", import.meta.url), { type: "module", name: "searchWorker" }),
		CALL_TIMEOUT_MS,
	);
