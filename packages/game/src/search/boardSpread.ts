import { RNG } from "@haelp/teto/engine";
import { placementCells } from "../pieces";
import { emptySimBoard, lockCells, type SimBoard } from "../sim/simBoard";
import { cleanStack } from "./cleanStack";
import { readyGap } from "./quad";

const BUCKET_COUNT = 6;

const BUCKET_CELLS = 4;

const DEALS = 40;

const HEIGHT_CAP = 12;

const SEED_RANGE = 2 ** 31 - 2;

const ATTEMPTS_PER_BOARD = 50;

const stackPrefixes = (seed: number, well: number): Array<SimBoard> => {
	let board = emptySimBoard();

	return cleanStack(seed, DEALS, HEIGHT_CAP, well).map((placement) => {
		board = lockCells(board, placementCells(placement), "none").board;

		return board;
	});
};

export const spreadBoards = (seed: number, perBucket: number, well: number): Array<Array<SimBoard>> => {
	const rng = new RNG(seed);
	const spread = Array.from({ length: BUCKET_COUNT }, (): Array<SimBoard> => []);
	const attempts = ATTEMPTS_PER_BOARD * perBucket * BUCKET_COUNT;

	for (let attempt = 0; attempt < attempts && spread.some((boards) => boards.length < perBucket); attempt++) {
		const prefixes = stackPrefixes(1 + Math.floor(rng.nextFloat() * SEED_RANGE), well);

		spread.forEach((boards, bucket) => {
			if (boards.length >= perBucket) return;

			const matches = prefixes.filter((board) => Math.ceil(readyGap(board, { well }) / BUCKET_CELLS) === bucket + 1);
			const picked = matches[Math.floor(rng.nextFloat() * matches.length)];

			if (picked) boards.push(picked);
		});
	}

	if (spread.some((boards) => boards.length < perBucket)) throw new Error(`Spread seed ${seed} left a bucket short`);

	return spread;
};
