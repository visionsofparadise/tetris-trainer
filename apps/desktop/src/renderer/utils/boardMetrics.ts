import type { Mino } from "@tetris-trainer/game";

type BoardRows = ReadonlyArray<ReadonlyArray<Mino | null>>;

export interface BoardMetrics {
	readonly height: number;
	readonly holes: number;
}

const topRow = (board: BoardRows, isFilled: (row: ReadonlyArray<Mino | null>) => boolean): number => {
	for (let y = board.length - 1; y >= 0; y--) {
		const row = board[y];

		if (row && isFilled(row)) return y;
	}

	return -1;
};

export const boardMetrics = (board: BoardRows): BoardMetrics => {
	const height = topRow(board, (row) => row.some((mino) => mino !== null)) + 1;
	const columns = board[0]?.length ?? 0;
	let holes = 0;

	for (let column = 0; column < columns; column++) {
		const top = topRow(board, (row) => row[column] !== null);

		for (let y = 0; y < top; y++) if (board[y]?.[column] === null) holes++;
	}

	return { height, holes };
};
