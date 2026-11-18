import type { Category, Opener } from "./Opener";
import type { Piece } from "@tetris-trainer/game";

export type OrderFilter = "no-hold" | "hold" | "mixed";

interface Deal {
	readonly order: Array<Piece>;
	readonly category: Category;
}

const POOLS: Record<OrderFilter, ReadonlyArray<Category>> = {
	"no-hold": ["no-hold"],
	hold: ["no-hold", "hold"],
	mixed: ["no-hold", "hold", "impossible"],
};

const pick = <T>(items: ReadonlyArray<T>, random: () => number): T => {
	const item = items[Math.floor(random() * items.length)];

	if (item === undefined) throw new Error("Cannot pick from an empty list");

	return item;
};

export const dealOrder = (opener: Opener, filter: OrderFilter, random = Math.random): Deal => {
	const category = pick(POOLS[filter], random);

	return { order: opener.deal(category), category };
};
