import { Mino } from "@tetris-trainer/game";

export const MINO_COLORS: Record<Mino, number> = {
	[Mino.I]: 0x4fdce6,
	[Mino.J]: 0x5c78ff,
	[Mino.L]: 0xff9150,
	[Mino.O]: 0xf2d34f,
	[Mino.S]: 0x45d18e,
	[Mino.T]: 0x9f7bff,
	[Mino.Z]: 0xff5c73,
	[Mino.GARBAGE]: 0x8a8c93,
	[Mino.BOMB]: 0xffb020,
};

export const LIME = 0xc8ff1f;
export const PINK = 0xff1f6b;

const SHADE = 0.55;
const CHANNEL_SHIFTS = [16, 8, 0];
const CHANNEL_MASK = 0xff;

export const shadeOf = (color: number): number =>
	CHANNEL_SHIFTS.reduce((shade, shift) => shade | (Math.round(((color >> shift) & CHANNEL_MASK) * SHADE) << shift), 0);

export const cssColor = (color: number): string => `#${color.toString(16).padStart(6, "0")}`;

export interface Sides {
	readonly left: boolean;
	readonly right: boolean;
	readonly top: boolean;
	readonly bottom: boolean;
}

interface Rect {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

export const exposedSides = (
	column: number,
	row: number,
	isMember: (column: number, row: number) => boolean,
): Sides => ({
	left: !isMember(column - 1, row),
	right: !isMember(column + 1, row),
	top: !isMember(column, row - 1),
	bottom: !isMember(column, row + 1),
});

const insetRect = (left: number, top: number, size: number, sides: Sides, line: number): Rect => {
	const x = left + (sides.left ? line : 0);
	const y = top + (sides.top ? line : 0);

	return {
		x,
		y,
		width: left + size - (sides.right ? line : 0) - x,
		height: top + size - (sides.bottom ? line : 0) - y,
	};
};

export interface CellBox {
	readonly left: number;
	readonly top: number;
	readonly size: number;
	readonly line: number;
}

interface Corners {
	readonly topLeft: boolean;
	readonly topRight: boolean;
	readonly bottomLeft: boolean;
	readonly bottomRight: boolean;
}

export interface BlockEdges {
	readonly sides: Sides;
	readonly corners: Corners;
}

export interface BlockFace {
	readonly inner: Rect;
	readonly notches: ReadonlyArray<Rect>;
}

export const shapeEdges = (
	column: number,
	row: number,
	isMember: (column: number, row: number) => boolean,
): BlockEdges => {
	const sides = exposedSides(column, row, isMember);
	const turns = (horizontal: boolean, vertical: boolean, dx: number, dy: number): boolean =>
		!horizontal && !vertical && !isMember(column + dx, row + dy);

	return {
		sides,
		corners: {
			topLeft: turns(sides.left, sides.top, -1, -1),
			topRight: turns(sides.right, sides.top, 1, -1),
			bottomLeft: turns(sides.left, sides.bottom, -1, 1),
			bottomRight: turns(sides.right, sides.bottom, 1, 1),
		},
	};
};

export const blockFace = ({ left, top, size, line }: CellBox, { sides, corners }: BlockEdges): BlockFace => {
	const notch = (isRight: boolean, isBottom: boolean): Rect => ({
		x: isRight ? left + size - line : left,
		y: isBottom ? top + size - line : top,
		width: line,
		height: line,
	});

	return {
		inner: insetRect(left, top, size, sides, line),
		notches: [
			...(corners.topLeft ? [notch(false, false)] : []),
			...(corners.topRight ? [notch(true, false)] : []),
			...(corners.bottomLeft ? [notch(false, true)] : []),
			...(corners.bottomRight ? [notch(true, true)] : []),
		],
	};
};
