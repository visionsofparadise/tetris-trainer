import { BOARD_COLUMNS, VISIBLE_ROWS } from "../engineOptions";
import { BAG, boxBlocks, ORIENTATIONS, pieceShape, type Block, type Piece } from "../pieces";
import { BOARD_ROWS, type SimBoard } from "./simBoard";

export interface SimShape {
	readonly cells: ReadonlyArray<Block>;
	readonly left: number;
	readonly right: number;
	readonly bottom: number;
	readonly top: number;
	readonly rowOffsets: ReadonlyArray<number>;
	readonly rowMasks: ReadonlyArray<number>;
	readonly columnBottoms: ReadonlyArray<number>;
}

export const SPAWN_ROW = VISIBLE_ROWS + 2;

export const shiftedMask = (mask: number, x: number): number => (x >= 0 ? mask << x : mask >> -x);

const simShape = (cells: ReadonlyArray<Block>): SimShape => {
	const rowOffsets = [...new Set(cells.map(([, y]) => y))].sort((first, second) => first - second);
	const left = Math.min(...cells.map(([x]) => x));
	const right = Math.max(...cells.map(([x]) => x));
	const rowMasks = rowOffsets.map((offset) =>
		cells.reduce((mask, [x, y]) => (y === offset ? mask | (1 << x) : mask), 0),
	);

	return {
		cells,
		left,
		right,
		bottom: rowOffsets[0] ?? 0,
		top: rowOffsets[rowOffsets.length - 1] ?? 0,
		rowOffsets,
		rowMasks,
		columnBottoms: Array.from({ length: right - left + 1 }, (_, column) =>
			Math.min(...cells.filter(([x]) => x === left + column).map(([, y]) => y)),
		),
	};
};

const SHAPES = new Map<Piece, ReadonlyArray<SimShape>>(
	BAG.map((mino) => [mino, ORIENTATIONS.map((_, rotation) => simShape(boxBlocks(mino, rotation)))]),
);

export const pieceShapes = (mino: Piece): ReadonlyArray<SimShape> => {
	const shapes = SHAPES.get(mino);

	if (!shapes) throw new Error(`No shapes for mino "${mino}"`);

	return shapes;
};

export const spawnColumn = (mino: Piece): number => Math.floor(BOARD_COLUMNS / 2 - pieceShape(mino).matrix.w / 2);

export const fits = (board: SimBoard, shape: SimShape, x: number, y: number): boolean => {
	if (x + shape.left < 0 || x + shape.right >= BOARD_COLUMNS || y + shape.bottom < 0 || y + shape.top >= BOARD_ROWS)
		return false;

	const { rowOffsets, rowMasks } = shape;

	for (let index = 0; index < rowOffsets.length; index++)
		if (((board.rows[y + (rowOffsets[index] ?? 0)] ?? 0) & shiftedMask(rowMasks[index] ?? 0, x)) !== 0) return false;

	return true;
};

export const shapeCells = (shape: SimShape, x: number, y: number): Array<Block> =>
	shape.cells.map(([cellX, cellY]) => [x + cellX, y + cellY]);
