import { BOARD_COLUMNS, VISIBLE_ROWS } from "@tetris-trainer/game";

export const PANEL_COLUMNS = 5;
export const PREVIEW_ROWS = 3;
export const HEADER_ROWS = 0.85;

const LAYOUT_COLUMNS = BOARD_COLUMNS + 2 * PANEL_COLUMNS;
const TETRIO_BOARD_HEIGHT_RATIO = 0.7;

export interface Size {
	readonly width: number;
	readonly height: number;
}

export interface Layout {
	readonly cellSize: number;
	readonly boardLeft: number;
	readonly boardTop: number;
	readonly holdLeft: number;
	readonly nextLeft: number;
}

export const layoutFor = ({ width, height }: Size): Layout => {
	const cellSize = Math.floor(Math.min((height * TETRIO_BOARD_HEIGHT_RATIO) / VISIBLE_ROWS, width / LAYOUT_COLUMNS));
	const boardLeft = (width - BOARD_COLUMNS * cellSize) / 2;

	return {
		cellSize,
		boardLeft,
		boardTop: (height - VISIBLE_ROWS * cellSize) / 2,
		holdLeft: boardLeft - PANEL_COLUMNS * cellSize,
		nextLeft: boardLeft + BOARD_COLUMNS * cellSize,
	};
};
