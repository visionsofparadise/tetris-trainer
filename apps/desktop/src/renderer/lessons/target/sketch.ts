import { BOARD_COLUMNS, placementCells, type Block, type Placement, type SimBoard } from "@tetris-trainer/game";

export interface Roof {
	readonly column: number;
	readonly gap: number;
	readonly cells: number;
}

export interface Sketch {
	readonly target: Placement;
	readonly paths: ReadonlyArray<Block>;
	readonly roofs: ReadonlyArray<Roof>;
	readonly heights: ReadonlyMap<number, number>;
	readonly holes: ReadonlyArray<number>;
}

const BOARD_ROWS = 40;

const FULL_ROW = (1 << BOARD_COLUMNS) - 1;

const FILLED = "X";

const EMPTY = ".";

const columnsOf = (cells: ReadonlyArray<Block>, column: number): Array<number> =>
	cells.flatMap(([x, y]) => (x === column ? [y] : []));

const fillColumn = (rows: Uint16Array, column: number, from: number, to: number): void => {
	for (let y = from; y < to; y++) rows[y] = (rows[y] ?? 0) | (1 << column);
};

const roofOf = (roofs: ReadonlyArray<Roof>, column: number): Roof | undefined =>
	roofs.find((roof) => roof.column === column);

export const sketchTop = ({ target, paths }: Sketch): number =>
	Math.max(...[...placementCells(target), ...paths].map(([, y]) => y));

const drawColumn = (rows: Uint16Array, sketch: Sketch, column: number, top: number): boolean => {
	const { target, paths, roofs, heights } = sketch;
	const bottom = target.row;
	const targetRows = columnsOf(placementCells(target), column);
	const pathRows = columnsOf(paths, column);
	const open = [...targetRows, ...pathRows];

	if (open.length === 0) {
		fillColumn(rows, column, bottom, heights.get(column) ?? top + 1);

		return true;
	}

	fillColumn(rows, column, bottom, Math.min(...open));

	if (pathRows.length > 0) return true;

	const high = Math.max(...targetRows);
	const roof = roofOf(roofs, column);

	fillColumn(rows, column, high + 1, top + 1);

	if (!roof) return true;

	if (roof.gap > 0 && high < top) return false;

	const start = top + 1 + roof.gap;

	fillColumn(rows, column, start, start + roof.cells);

	return true;
};

export const drawSketch = (sketch: Sketch): SimBoard | null => {
	const rows = new Uint16Array(BOARD_ROWS);
	const top = sketchTop(sketch);

	sketch.holes.forEach((hole, y) => {
		rows[y] = FULL_ROW & ~(1 << hole);
	});

	for (let column = 0; column < BOARD_COLUMNS; column++) if (!drawColumn(rows, sketch, column, top)) return null;

	return rows.includes(FULL_ROW) ? null : { rows };
};

export const boardRows = ({ rows }: SimBoard): Array<string> => {
	let height = rows.length;

	while (height > 0 && rows[height - 1] === 0) height--;

	return Array.from(rows.slice(0, height))
		.reverse()
		.map((row) =>
			Array.from({ length: BOARD_COLUMNS }, (_, x) => ((row & (1 << x)) === 0 ? EMPTY : FILLED)).join(""),
		);
};

const isFilledAt = ({ rows }: SimBoard, [x, y]: Block): boolean =>
	x < 0 || x >= BOARD_COLUMNS || y < 0 || ((rows[y] ?? 0) & (1 << x)) !== 0;

export const isOpenAbove = (board: SimBoard, cells: ReadonlyArray<Block>): boolean =>
	cells.every(([x, y]) => {
		for (let row = y; row < BOARD_ROWS; row++) if (isFilledAt(board, [x, row])) return false;

		return true;
	});
