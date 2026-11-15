import { BOARD_COLUMNS, VISIBLE_ROWS } from "@tetris-trainer/game";

export const SPAWN_ROWS = 2;

export interface Size {
	readonly width: number;
	readonly height: number;
}

export interface Layout {
	readonly cellSize: number;
	readonly boardTop: number;
}

export const layoutFor = ({ width, height }: Size): Layout => {
	const cellSize = width / BOARD_COLUMNS;

	return { cellSize, boardTop: height - VISIBLE_ROWS * cellSize };
};
