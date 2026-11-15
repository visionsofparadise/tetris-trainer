import { BAG, type Piece } from "@tetris-trainer/game";
import { plan, startState } from "./planner";
import type { Opener } from "./Opener";

export type Category = "no-hold" | "hold" | "impossible";

export type OrderFilter = Category | "mixed";

export type OrderPool = OrderFilter | "possible";

const CATEGORIES: ReadonlyArray<Category> = ["no-hold", "hold", "impossible"];

const POOLS: Record<"mixed" | "possible", ReadonlyArray<Category>> = {
	mixed: CATEGORIES,
	possible: ["no-hold", "hold"],
};

const permutations = (pieces: ReadonlyArray<Piece>): Array<Array<Piece>> =>
	pieces.length <= 1
		? [[...pieces]]
		: pieces.flatMap((piece, index) =>
				permutations([...pieces.slice(0, index), ...pieces.slice(index + 1)]).map((rest) => [piece, ...rest]),
			);

export const categorize = (opener: Opener, order: ReadonlyArray<Piece>): Category => {
	if (plan(opener, startState(order), false)) return "no-hold";

	return plan(opener, startState(order)) ? "hold" : "impossible";
};

const cache = new WeakMap<Opener, Record<Category, Array<Array<Piece>>>>();

export const ordersByCategory = (opener: Opener): Record<Category, Array<Array<Piece>>> => {
	const cached = cache.get(opener);

	if (cached) return cached;

	const orders: Record<Category, Array<Array<Piece>>> = { "no-hold": [], hold: [], impossible: [] };

	for (const order of permutations(BAG)) orders[categorize(opener, order)].push(order);

	cache.set(opener, orders);

	return orders;
};

const pick = <T>(items: ReadonlyArray<T>, random: () => number): T => {
	const item = items[Math.floor(random() * items.length)];

	if (item === undefined) throw new Error("Cannot pick from an empty list");

	return item;
};

export const dealOrder = (opener: Opener, pool: OrderPool, random = Math.random): Array<Piece> => {
	const category = pool === "mixed" || pool === "possible" ? pick(POOLS[pool], random) : pool;

	return pick(ordersByCategory(opener)[category], random);
};
