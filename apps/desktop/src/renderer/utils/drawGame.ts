import { Mino, NEXT_COUNT, piecePreview, VISIBLE_ROWS, type Block, type Game } from "@tetris-trainer/game";
import { Color, type Graphics } from "pixi.js";
import { HEADER_ROWS, PANEL_COLUMNS, PREVIEW_ROWS, type Layout } from "./gameLayout";

const SPAWN_ROWS = 2;
const GHOST_ALPHA = 0.25;
const FRAME_COLOR = 0xffffff;
const SHADE = [0.65, 0.65, 0.65];
const LINE_RATIO = 0.08;
const INNER_INSET_RATIO = 0.3;
const CHAMFER_RATIO = 0.5;

const MINO_COLORS: Record<Mino, number> = {
	[Mino.I]: 0x3bd6a2,
	[Mino.J]: 0x5b4fc4,
	[Mino.L]: 0xd9773a,
	[Mino.O]: 0xd6b93a,
	[Mino.S]: 0x8fc93a,
	[Mino.T]: 0xb04fbd,
	[Mino.Z]: 0xe0404f,
	[Mino.GARBAGE]: 0x6b6b6b,
	[Mino.BOMB]: 0xffa500,
};

const drawBlock = (graphics: Graphics, left: number, top: number, mino: Mino, cellSize: number, alpha = 1): void => {
	const color = MINO_COLORS[mino];
	const shade = Color.shared.setValue(color).multiply(SHADE).toNumber();
	const bevel = cellSize * LINE_RATIO;
	const inset = cellSize * INNER_INSET_RATIO;

	graphics.rect(left, top, cellSize, cellSize).fill({ color: shade, alpha });
	graphics.rect(left + bevel, top + bevel, cellSize - 2 * bevel, cellSize - 2 * bevel).fill({ color, alpha });
	graphics
		.rect(left + inset, top + inset, cellSize - 2 * inset, cellSize - 2 * inset)
		.stroke({ color: shade, width: bevel, alpha });
};

const drawBoardBlock = (graphics: Graphics, [x, y]: Block, mino: Mino, layout: Layout, alpha?: number): void => {
	const { cellSize, boardLeft, boardTop } = layout;

	drawBlock(graphics, boardLeft + x * cellSize, boardTop + (VISIBLE_ROWS - 1 - y) * cellSize, mino, cellSize, alpha);
};

const drawPreview = (graphics: Graphics, mino: Mino, left: number, top: number, layout: Layout): void => {
	const { cellSize } = layout;
	const { width, height, blocks } = piecePreview(mino);
	const offsetX = left + ((PANEL_COLUMNS - width) * cellSize) / 2;
	const offsetY = top + ((PREVIEW_ROWS - height) * cellSize) / 2;

	for (const [x, y] of blocks) drawBlock(graphics, offsetX + x * cellSize, offsetY + y * cellSize, mino, cellSize);
};

const drawPanel = (graphics: Graphics, innerX: number, outerX: number, rows: number, layout: Layout): void => {
	const { cellSize, boardTop } = layout;
	const bottom = boardTop + (HEADER_ROWS + rows) * cellSize;
	const chamfer = cellSize * CHAMFER_RATIO;
	const chamferX = outerX + chamfer * Math.sign(innerX - outerX);

	graphics
		.moveTo(innerX, boardTop)
		.lineTo(outerX, boardTop)
		.lineTo(outerX, bottom - chamfer)
		.lineTo(chamferX, bottom)
		.lineTo(innerX, bottom)
		.stroke({ color: FRAME_COLOR, width: cellSize * LINE_RATIO });
	graphics
		.rect(Math.min(innerX, outerX), boardTop, PANEL_COLUMNS * cellSize, HEADER_ROWS * cellSize)
		.fill(FRAME_COLOR);
};

const drawFrame = (graphics: Graphics, layout: Layout): void => {
	const { cellSize, boardLeft, boardTop, holdLeft, nextLeft } = layout;
	const boardBottom = boardTop + VISIBLE_ROWS * cellSize;

	graphics
		.moveTo(boardLeft, boardTop)
		.lineTo(boardLeft, boardBottom)
		.lineTo(nextLeft, boardBottom)
		.lineTo(nextLeft, boardTop)
		.stroke({ color: FRAME_COLOR, width: cellSize * LINE_RATIO });
	drawPanel(graphics, boardLeft, holdLeft, PREVIEW_ROWS, layout);
	drawPanel(graphics, nextLeft, nextLeft + PANEL_COLUMNS * cellSize, NEXT_COUNT * PREVIEW_ROWS, layout);
};

export const drawGame = (graphics: Graphics, game: Game, layout: Layout): void => {
	const { cellSize, holdLeft, nextLeft, boardTop } = layout;
	const panelTop = boardTop + HEADER_ROWS * cellSize;

	graphics.clear();

	game.board.slice(0, VISIBLE_ROWS + SPAWN_ROWS).forEach((row, y) => {
		row.forEach((mino, x) => {
			if (mino !== null) drawBoardBlock(graphics, [x, y], mino, layout);
		});
	});

	const { mino, blocks } = game.falling;

	for (const block of game.ghost) drawBoardBlock(graphics, block, mino, layout, GHOST_ALPHA);

	for (const block of blocks) drawBoardBlock(graphics, block, mino, layout);

	drawFrame(graphics, layout);

	if (game.hold !== null) drawPreview(graphics, game.hold, holdLeft, panelTop, layout);

	game.next.forEach((next, index) =>
		drawPreview(graphics, next, nextLeft, panelTop + index * PREVIEW_ROWS * cellSize, layout),
	);
};
