const MODULUS = 2147483647;

const MULTIPLIER = 16807;

const WARM_UP = 3;

export interface Random {
	readonly next: () => number;
	readonly below: (count: number) => number;
	readonly pick: <T>(items: ReadonlyArray<T>) => T;
	readonly chance: (probability: number) => boolean;
}

export const nextSeed = (seed: number): number => (Math.max(1, seed % MODULUS) * MULTIPLIER) % MODULUS;

export const seeded = (seed: number): Random => {
	let state = Math.max(1, seed % MODULUS);

	const next = (): number => {
		state = (state * MULTIPLIER) % MODULUS;

		return state / MODULUS;
	};

	const below = (count: number): number => Math.floor(next() * count);

	for (let draw = 0; draw < WARM_UP; draw++) next();

	return {
		next,
		below,
		pick: <T>(items: ReadonlyArray<T>): T => {
			const item = items[below(items.length)];

			if (item === undefined) throw new Error("Nothing to pick from");

			return item;
		},
		chance: (probability) => next() < probability,
	};
};
