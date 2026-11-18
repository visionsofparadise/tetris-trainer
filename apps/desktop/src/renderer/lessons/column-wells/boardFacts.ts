import { BOARD_COLUMNS, type SimBoard } from "@tetris-trainer/game";

const FULL_ROW = (1 << BOARD_COLUMNS) - 1;

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

const holdsCoveredCell = ({ rows }: SimBoard, row: number): boolean => {
	let above = 0;

	for (let y = rows.length - 1; y > row; y--) above |= rows[y] ?? 0;

	return (above & ~(rows[row] ?? 0) & FULL_ROW) !== 0;
};

const coveredMasks = ({ rows }: SimBoard): Array<number> => {
	const masks = Array.from({ length: rows.length }, () => 0);
	let above = 0;

	for (let y = rows.length - 1; y >= 0; y--) {
		masks[y] = above & ~(rows[y] ?? 0) & FULL_ROW;
		above |= rows[y] ?? 0;
	}

	return masks;
};

export const buriedRows = (board: SimBoard, well: number): number =>
	coveredMasks(board)
		.slice(deadRows(board, well))
		.filter((mask) => mask !== 0).length;

export const wellFloor = ({ rows }: SimBoard, well: number): number => {
	for (let y = rows.length - 1; y >= 0; y--) if (((rows[y] ?? 0) & (1 << well)) !== 0) return y + 1;

	return 0;
};

export const deadRows = (board: SimBoard, well: number): number => {
	let floor = wellFloor(board, well);

	while (floor < board.rows.length && holdsCoveredCell(board, floor)) floor++;

	return floor;
};

export const columnHeights = ({ rows }: SimBoard): Array<number> => {
	const heights = Array.from({ length: BOARD_COLUMNS }, () => 0);

	for (const [y, row] of rows.entries()) {
		if (row === 0) continue;

		for (let x = 0; x < BOARD_COLUMNS; x++) if ((row & (1 << x)) !== 0) heights[x] = y + 1;
	}

	return heights;
};

const PIT_DEPTH = 2;

export const deepPits = (board: SimBoard, well: number): number => {
	const heights = columnHeights(board);

	return heights.filter((height, x) => {
		const left = x - 1 === well ? Infinity : (heights[x - 1] ?? Infinity);
		const right = x + 1 === well ? Infinity : (heights[x + 1] ?? Infinity);

		return x !== well && Math.min(left, right) - height >= PIT_DEPTH;
	}).length;
};

const I_PIT_DEPTH = 3;

export const barredPits = (board: SimBoard, well: number, barred: ReadonlyArray<number>): number => {
	const heights = columnHeights(board);

	return heights.reduce((sum, height, x) => {
		const left = x - 1 === well ? Infinity : (heights[x - 1] ?? Infinity);
		const right = x + 1 === well ? Infinity : (heights[x + 1] ?? Infinity);
		const depth = Math.min(left, right) - height;

		return barred.includes(x) && depth >= I_PIT_DEPTH - 1 ? sum + depth - 1 : sum;
	}, 0);
};

export const bumpiness = (board: SimBoard, well: number): number => {
	const heights = columnHeights(board).filter((_, x) => x !== well);

	return heights.reduce((sum, height, index) => sum + Math.abs(height - (heights[index + 1] ?? height)), 0);
};
