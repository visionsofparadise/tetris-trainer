import { BOARD_COLUMNS, BOARD_SIZE } from "../engineOptions";
import type { Block } from "../pieces";
import type { Mino, SpinType } from "@haelp/teto/engine";

export interface SimBoard {
	readonly rows: Uint16Array;
}

export interface SimLock {
	readonly added: SimBoard;
	readonly board: SimBoard;
	readonly lines: number;
	readonly spin: SpinType;
}

export const BOARD_ROWS = BOARD_SIZE.height + BOARD_SIZE.buffer;

export const FULL_ROW = (1 << BOARD_COLUMNS) - 1;

export const emptySimBoard = (): SimBoard => ({ rows: new Uint16Array(BOARD_ROWS) });

export const isFilled = (board: SimBoard, x: number, y: number): boolean =>
	x < 0 || x >= BOARD_COLUMNS || y < 0 || y >= BOARD_ROWS || ((board.rows[y] ?? 0) & (1 << x)) !== 0;

export const simBoardOf = (board: ReadonlyArray<ReadonlyArray<Mino | null>>): SimBoard => {
	const sim = emptySimBoard();

	board.slice(0, BOARD_ROWS).forEach((row, y) => {
		sim.rows[y] = row.reduce((mask, mino, x) => (mino === null ? mask : mask | (1 << x)), 0);
	});

	return sim;
};

const clearRows = (rows: Uint16Array): { readonly rows: Uint16Array; readonly lines: number } => {
	const kept = rows.filter((row) => row !== FULL_ROW);
	const cleared = new Uint16Array(BOARD_ROWS);

	cleared.set(kept);

	return { rows: cleared, lines: BOARD_ROWS - kept.length };
};

export const lockCells = (board: SimBoard, cells: ReadonlyArray<Block>, spin: SpinType): SimLock => {
	const added = Uint16Array.from(board.rows);

	for (const [x, y] of cells) added[y] = (added[y] ?? 0) | (1 << x);

	const { rows, lines } = clearRows(added);

	return { added: { rows: added }, board: { rows }, lines, spin };
};

export const isHoleFree = (board: SimBoard, cells: ReadonlyArray<Block>, deadRows = 0): boolean =>
	cells.every(
		([x, y]) =>
			y - 1 < deadRows ||
			isFilled(board, x, y - 1) ||
			cells.some(([cellX, cellY]) => cellX === x && cellY === y - 1),
	);
