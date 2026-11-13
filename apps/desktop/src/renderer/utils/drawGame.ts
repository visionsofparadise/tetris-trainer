import { BOARD_COLUMNS, Mino, piecePreview, VISIBLE_ROWS, type Block, type Game } from "@tetris-trainer/game";
import type { Graphics } from "pixi.js";

const CELL_SIZE = 30;
const SPAWN_ROWS = 2;
const PANEL_WIDTH = 5 * CELL_SIZE;
const PREVIEW_HEIGHT = 3 * CELL_SIZE;
const BOARD_LEFT = PANEL_WIDTH;
const BOARD_TOP = SPAWN_ROWS * CELL_SIZE;
const BOARD_WIDTH = BOARD_COLUMNS * CELL_SIZE;
const BOARD_HEIGHT = VISIBLE_ROWS * CELL_SIZE;
const NEXT_LEFT = BOARD_LEFT + BOARD_WIDTH;
const GHOST_ALPHA = 0.25;

export const CANVAS_WIDTH = BOARD_WIDTH + 2 * PANEL_WIDTH;
export const CANVAS_HEIGHT = BOARD_TOP + BOARD_HEIGHT;

const MINO_COLORS: Record<Mino, number> = {
	[Mino.I]: 0x31c7ef,
	[Mino.J]: 0x5a65ad,
	[Mino.L]: 0xef7921,
	[Mino.O]: 0xf7d308,
	[Mino.S]: 0x42b642,
	[Mino.T]: 0xad4d9c,
	[Mino.Z]: 0xef2029,
	[Mino.GARBAGE]: 0x6b6b6b,
	[Mino.BOMB]: 0xffa500,
};

const drawBoardBlock = (graphics: Graphics, [x, y]: Block, color: number, alpha = 1): void => {
	const left = BOARD_LEFT + x * CELL_SIZE;
	const top = BOARD_TOP + (VISIBLE_ROWS - 1 - y) * CELL_SIZE;

	graphics.rect(left, top, CELL_SIZE, CELL_SIZE).fill({ color, alpha });
};

const drawPreview = (graphics: Graphics, mino: Mino, left: number, top: number): void => {
	const { width, height, blocks } = piecePreview(mino);
	const offsetX = left + (PANEL_WIDTH - width * CELL_SIZE) / 2;
	const offsetY = top + (PREVIEW_HEIGHT - height * CELL_SIZE) / 2;

	for (const [x, y] of blocks) {
		graphics.rect(offsetX + x * CELL_SIZE, offsetY + y * CELL_SIZE, CELL_SIZE, CELL_SIZE).fill(MINO_COLORS[mino]);
	}
};

export const drawGame = (graphics: Graphics, game: Game): void => {
	graphics.clear();
	graphics.rect(BOARD_LEFT, BOARD_TOP, BOARD_WIDTH, BOARD_HEIGHT).fill(0x000000);

	game.board.slice(0, VISIBLE_ROWS + SPAWN_ROWS).forEach((row, y) => {
		row.forEach((mino, x) => {
			if (mino !== null) drawBoardBlock(graphics, [x, y], MINO_COLORS[mino]);
		});
	});

	const { mino, blocks } = game.falling;

	for (const block of game.ghost) drawBoardBlock(graphics, block, MINO_COLORS[mino], GHOST_ALPHA);

	for (const block of blocks) drawBoardBlock(graphics, block, MINO_COLORS[mino]);

	if (game.hold !== null) drawPreview(graphics, game.hold, 0, BOARD_TOP);

	game.next.forEach((next, index) => drawPreview(graphics, next, NEXT_LEFT, BOARD_TOP + index * PREVIEW_HEIGHT));
};
