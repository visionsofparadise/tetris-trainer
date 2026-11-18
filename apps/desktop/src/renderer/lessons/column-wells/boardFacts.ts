import { BOARD_COLUMNS, type SimBoard } from "@tetris-trainer/game";

export const stackHeight = ({ rows }: SimBoard): number => {
	for (let y = rows.length - 1; y >= 0; y--) if (rows[y] !== 0) return y + 1;

	return 0;
};

export const coveredCells = ({ rows }: SimBoard): number => {
	let covered = 0;
	let above = 0;

	for (let y = rows.length - 1; y >= 0; y--) {
		const row = rows[y] ?? 0;

		for (let rest = above & ~row; rest !== 0; rest &= rest - 1) covered++;

		above |= row;
	}

	return covered;
};

export const wellFloor = ({ rows }: SimBoard, well: number): number => {
	for (let y = rows.length - 1; y >= 0; y--) if (((rows[y] ?? 0) & (1 << well)) !== 0) return y + 1;

	return 0;
};

const columnHeight = ({ rows }: SimBoard, x: number): number => {
	for (let y = rows.length - 1; y >= 0; y--) if (((rows[y] ?? 0) & (1 << x)) !== 0) return y + 1;

	return 0;
};

const PIT_DEPTH = 2;

export const deepPits = (board: SimBoard, well: number): number => {
	const heights = Array.from({ length: BOARD_COLUMNS }, (_, x) => columnHeight(board, x));

	return heights.filter((height, x) => {
		const left = x - 1 === well ? Infinity : (heights[x - 1] ?? Infinity);
		const right = x + 1 === well ? Infinity : (heights[x + 1] ?? Infinity);

		return x !== well && Math.min(left, right) - height >= PIT_DEPTH;
	}).length;
};

export const bumpiness = (board: SimBoard, well: number): number => {
	const heights = Array.from({ length: BOARD_COLUMNS }, (_, x) => columnHeight(board, x)).filter((_, x) => x !== well);

	return heights.reduce((sum, height, index) => sum + Math.abs(height - (heights[index + 1] ?? height)), 0);
};
