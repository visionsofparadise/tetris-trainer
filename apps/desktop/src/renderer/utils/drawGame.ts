import { VISIBLE_ROWS, type Block, type Game, type Mino } from "@tetris-trainer/game";
import { blockFace, exposedSides, LIME, MINO_COLORS, PINK, shadeOf, type Sides } from "./blockStyle";
import { SPAWN_ROWS, type Layout } from "./gameLayout";
import type { BoardMark } from "../models/BoardMark";
import type { GameDisplay } from "../models/GameDisplay";
import type { Graphics } from "pixi.js";

const EDGE_RATIO = 1 / 30;
const HATCH_SPACING_RATIO = 0.2;
const HATCH_WIDTH_RATIO = 0.04;
const GHOST_ALPHA = 0.6;
const TARGET_ALPHA = 0.55;
const MISTAKE_WIDTH = 2;

interface Cell {
	readonly left: number;
	readonly top: number;
}

const blockKey = ([x, y]: Block): string => `${x},${y}`;

const memberOf = (blocks: ReadonlyArray<Block>) => {
	const keys = new Set(blocks.map(blockKey));

	return (x: number, y: number): boolean => keys.has(blockKey([x, y]));
};

const cellAt = ([x, y]: Block, { cellSize, boardTop }: Layout): Cell => ({
	left: x * cellSize,
	top: boardTop + (VISIBLE_ROWS - 1 - y) * cellSize,
});

const sidesOf = ([x, y]: Block, isMember: (x: number, y: number) => boolean): Sides =>
	exposedSides(x, -y, (column, row) => isMember(column, -row));

const edgeWidth = (cellSize: number): number => Math.max(1, Math.round(cellSize * EDGE_RATIO));

const drawBlock = (
	graphics: Graphics,
	cell: Cell,
	mino: Mino,
	[x, y]: Block,
	isMember: (x: number, y: number) => boolean,
	cellSize: number,
): void => {
	const color = MINO_COLORS[mino];
	const shade = shadeOf(color);
	const box = { left: cell.left, top: cell.top, size: cellSize, line: edgeWidth(cellSize) };
	const { inner, notches } = blockFace(box, x, -y, (column, row) => isMember(column, -row));

	graphics.rect(cell.left, cell.top, cellSize, cellSize).fill(shade);
	graphics.rect(inner.x, inner.y, inner.width, inner.height).fill(color);

	for (const notch of notches) graphics.rect(notch.x, notch.y, notch.width, notch.height).fill(shade);
};

const drawHatch = (graphics: Graphics, { left, top }: Cell, cellSize: number): void => {
	const spacing = cellSize * HATCH_SPACING_RATIO;
	const first = Math.ceil((left + top) / spacing) * spacing;

	for (let sum = first; sum < left + top + 2 * cellSize; sum += spacing) {
		const startX = Math.max(left, sum - (top + cellSize));
		const endX = Math.min(left + cellSize, sum - top);

		graphics.moveTo(startX, sum - startX).lineTo(endX, sum - endX);
	}
};

const drawHatched = (
	graphics: Graphics,
	blocks: ReadonlyArray<Block>,
	color: number,
	alpha: number,
	layout: Layout,
): void => {
	for (const block of blocks) drawHatch(graphics, cellAt(block, layout), layout.cellSize);

	graphics.stroke({ color, alpha, width: Math.max(1, layout.cellSize * HATCH_WIDTH_RATIO) });
};

const drawOutline = (graphics: Graphics, blocks: ReadonlyArray<Block>, color: number, layout: Layout): void => {
	const { cellSize } = layout;
	const isMember = memberOf(blocks);
	const half = MISTAKE_WIDTH / 2;

	for (const block of blocks) {
		const { left, top } = cellAt(block, layout);
		const sides = sidesOf(block, isMember);
		const right = left + cellSize;
		const bottom = top + cellSize;

		if (sides.top) graphics.moveTo(left, top + half).lineTo(right, top + half);

		if (sides.bottom) graphics.moveTo(left, bottom - half).lineTo(right, bottom - half);

		if (sides.left) graphics.moveTo(left + half, top).lineTo(left + half, bottom);

		if (sides.right) graphics.moveTo(right - half, top).lineTo(right - half, bottom);
	}

	graphics.stroke({ color, width: MISTAKE_WIDTH });
};

const drawStack = (graphics: Graphics, game: Game, layout: Layout): void => {
	const board = game.board.slice(0, VISIBLE_ROWS + SPAWN_ROWS);
	const isSame = (mino: Mino) => (x: number, y: number) => board[y]?.[x] === mino;

	board.forEach((row, y) => {
		row.forEach((mino, x) => {
			if (mino === null) return;

			drawBlock(graphics, cellAt([x, y], layout), mino, [x, y], isSame(mino), layout.cellSize);
		});
	});
};

const drawFalling = (graphics: Graphics, game: Game, layout: Layout): void => {
	const { mino, blocks } = game.falling;
	const isMember = memberOf(blocks);

	drawHatched(graphics, game.ghost, MINO_COLORS[mino], GHOST_ALPHA, layout);

	for (const block of blocks) drawBlock(graphics, cellAt(block, layout), mino, block, isMember, layout.cellSize);
};

export const drawGame = (
	graphics: Graphics,
	game: Game,
	layout: Layout,
	marks: ReadonlyArray<BoardMark>,
	display: GameDisplay,
): void => {
	graphics.clear();
	drawStack(graphics, game, layout);

	for (const { cells, tone } of marks) if (tone === "target") drawHatched(graphics, cells, LIME, TARGET_ALPHA, layout);

	if (display === "play") drawFalling(graphics, game, layout);

	for (const { cells, tone } of marks) if (tone === "mistake") drawOutline(graphics, cells, PINK, layout);
};
