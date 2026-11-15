import { BOARD_COLUMNS, VISIBLE_ROWS } from "@tetris-trainer/game";
import { SPAWN_ROWS, type Size } from "./gameLayout";
import type { CSSProperties } from "react";

const SIDE_CELLS = 3.5;
const MIN_SIDE = 104;
const PREVIEW_RATIO = 0.55;
const MIN_PREVIEW = 15;
const HOLD_CELLS = 2.4;
const MIN_HOLD = 72;
const NEXT_SLOT_CELLS = 2.15;
const MIN_NEXT_SLOT = 56;
const COLUMN_GAP = 22;
const WELL_PADDING = 12;
const INPUT_GAP = 18;
const INPUT_ROW = 34;
const ASIDE_GAP = 52;
const ASIDE_WIDTH = 440;
const MIN_CELL = 14;
const HEADER_HEIGHT = 72;
const STAGE_PADDING_X = 2 * 32;
const STAGE_PADDING_Y = 24 + 48;

const VERTICAL_CHROME = WELL_PADDING + INPUT_GAP + INPUT_ROW;
const HORIZONTAL_CHROME = 2 * COLUMN_GAP + WELL_PADDING + ASIDE_GAP + ASIDE_WIDTH;

const scaled = (cell: number, ratio: number, minimum: number): number => Math.max(minimum, Math.round(cell * ratio));

const widthFit = (width: number): number => {
	const withMinimumSides = (width - HORIZONTAL_CHROME - 2 * MIN_SIDE) / BOARD_COLUMNS;

	return withMinimumSides * SIDE_CELLS <= MIN_SIDE
		? withMinimumSides
		: (width - HORIZONTAL_CHROME) / (BOARD_COLUMNS + 2 * SIDE_CELLS);
};

export const cellSizeFor = ({ width, height }: Size): number => {
	const fit = Math.floor(Math.min((height - VERTICAL_CHROME) / (VISIBLE_ROWS + SPAWN_ROWS), widthFit(width)));

	return Math.max(MIN_CELL, fit);
};

export const windowCellSize = ({ width, height }: Size): number =>
	cellSizeFor({ width: width - STAGE_PADDING_X, height: height - HEADER_HEIGHT - STAGE_PADDING_Y });

export const stageVariables = (cell: number): CSSProperties =>
	({
		"--cell": `${cell}px`,
		"--side-width": `${scaled(cell, SIDE_CELLS, MIN_SIDE)}px`,
		"--preview-cell": `${scaled(cell, PREVIEW_RATIO, MIN_PREVIEW)}px`,
		"--hold-height": `${scaled(cell, HOLD_CELLS, MIN_HOLD)}px`,
		"--next-slot": `${scaled(cell, NEXT_SLOT_CELLS, MIN_NEXT_SLOT)}px`,
		"--board-width": `${cell * BOARD_COLUMNS}px`,
		"--board-height": `${cell * VISIBLE_ROWS}px`,
		"--spawn-height": `${cell * SPAWN_ROWS}px`,
		"--canvas-height": `${cell * (VISIBLE_ROWS + SPAWN_ROWS)}px`,
		"--well-width": `${cell * BOARD_COLUMNS + WELL_PADDING}px`,
		"--well-height": `${cell * VISIBLE_ROWS + WELL_PADDING}px`,
	}) as CSSProperties;
