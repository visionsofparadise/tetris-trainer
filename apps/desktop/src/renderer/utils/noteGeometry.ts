import { BOARD_COLUMNS, type Block } from "@tetris-trainer/game";

export interface Point {
	readonly x: number;
	readonly y: number;
}

export interface Rect {
	readonly left: number;
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
}

export interface Leader {
	readonly start: Point;
	readonly end: Point;
}

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

const closestPoint = ({ left, top, right, bottom }: Rect, { x, y }: Point): Point => ({
	x: clamp(x, left, right),
	y: clamp(y, top, bottom),
});

const centerOf = ({ left, top, right, bottom }: Rect): Point => ({ x: (left + right) / 2, y: (top + bottom) / 2 });

const distance = (first: Point, second: Point): number => Math.hypot(first.x - second.x, first.y - second.y);

export const cellsPoint = (blocks: ReadonlyArray<Block>, board: Rect): Point => {
	const cell = (board.right - board.left) / BOARD_COLUMNS;
	const centers = blocks.map(([x, y]) => ({ x: board.left + (x + 0.5) * cell, y: board.bottom - (y + 0.5) * cell }));
	const middle = {
		x: centers.reduce((sum, { x }) => sum + x, 0) / centers.length,
		y: centers.reduce((sum, { y }) => sum + y, 0) / centers.length,
	};

	return centers.reduce((best, center) => (distance(center, middle) < distance(best, middle) ? center : best));
};

const ANCHOR_INSET = 0.25;

const insetRect = ({ left, top, right, bottom }: Rect): Rect => {
	const x = (right - left) * ANCHOR_INSET;
	const y = (bottom - top) * ANCHOR_INSET;

	return { left: left + x, top: top + y, right: right - x, bottom: bottom - y };
};

const edgePoint = (target: Rect, card: Rect): Point => {
	const { x, y } = closestPoint(insetRect(target), centerOf(card));

	if (card.left >= target.right) return { x: target.right, y };

	if (card.right <= target.left) return { x: target.left, y };

	return { x, y: card.top >= target.bottom ? target.bottom : card.bottom <= target.top ? target.top : y };
};

export const leaderTo = (card: Rect, target: Point | Rect): Leader => {
	const end = "x" in target ? target : edgePoint(target, card);

	return { start: closestPoint(card, end), end };
};
