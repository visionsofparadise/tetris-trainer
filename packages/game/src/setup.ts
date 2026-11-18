import { BoardConnections, legal, Mino, type Board, type Tile } from "@haelp/teto/engine";
import { bagRemainder, type DrawnPiece } from "./bag";
import { placementCells, type Block, type Piece, type Placement } from "./pieces";
import { SetupError } from "./SetupError";
import { pieceConnections } from "./tiles";

export interface Garbage {
	readonly column: number;
	readonly amount: number;
}

export interface Hold {
	readonly hold: Piece;
}

export interface Dig {
	readonly dig: number;
}

export interface Rows {
	readonly rows: ReadonlyArray<string>;
}

export type BoardItem = Placement | Garbage | Hold | Dig | Rows;

export type QueueMode = "continue-bag" | "fresh-bag" | "any";

export interface GameSetup {
	readonly board: ReadonlyArray<BoardItem>;
	readonly validate: boolean;
	readonly queue: { readonly pieces: ReadonlyArray<Piece>; readonly mode: QueueMode };
	readonly holdEnabled: boolean;
	readonly seed?: number;
}

export interface BoardPlay {
	readonly draws: ReadonlyArray<DrawnPiece>;
	readonly hold: Piece | null;
	readonly falling: Piece | null;
	readonly holdLocked: boolean;
}

const isPlacement = (item: BoardItem): item is Placement => "mino" in item;

const isHold = (item: BoardItem): item is Hold => "hold" in item;

const isDig = (item: BoardItem): item is Dig => "dig" in item;

const isRows = (item: BoardItem): item is Rows => "rows" in item;

const FILLED = "X";

const EMPTY = ".";

const itemLabel = (index: number): string => `Board item ${index + 1}`;

const lowered = (cells: ReadonlyArray<Block>): Array<Block> => cells.map(([x, y]) => [x, y - 1]);

export const cellsSettle = (cells: ReadonlyArray<Block>, state: Array<Array<Tile>>): boolean =>
	legal([...cells], state) && !legal(lowered(cells), state);

export const insertGarbage = (board: Board, { column, amount }: Garbage): void => {
	board.insertGarbage({ amount, size: 1, column, bombs: false, isBeginning: true, isEnd: true });
};

export const removeGarbage = (board: Board, amount: number): number => {
	const garbageRows = board.state
		.flatMap((row, y) => (row.some((tile) => tile?.mino === Mino.GARBAGE) ? [y] : []))
		.slice(0, amount);

	for (const y of garbageRows.reverse()) {
		board.state.splice(y, 1);
		board.state.push(new Array<Tile>(board.width).fill(null));
	}

	return garbageRows.length;
};

const addPlacement = (board: Board, placement: Placement, validate: boolean, index: number): void => {
	const cells = placementCells(placement);
	const label = `${itemLabel(index)} (${placement.mino.toUpperCase()})`;

	if (validate && !legal(cells, board.state)) throw new SetupError(`${label} overlaps the stack or leaves the board`);

	if (validate && legal(lowered(cells), board.state)) throw new SetupError(`${label} is floating`);

	board.add(
		...cells.map((cell): [Tile, number, number] => [
			{ mino: placement.mino, connections: pieceConnections(cells, cell) },
			...cell,
		]),
	);
	board.clearLines();
};

const digRows = (board: Board, { dig }: Dig): void => {
	board.state.splice(0, dig);

	while (board.state.length < board.fullHeight) board.state.push(new Array<Tile>(board.width).fill(null));

	for (const tile of board.state[0] ?? []) if (tile) tile.connections |= BoardConnections.BOTTOM;
};

const rowCells = ({ rows }: Rows, width: number, label = "Rows"): Array<Block> =>
	rows.flatMap((text, index): Array<Block> => {
		const row = rows.length - 1 - index;

		if (text.length !== width) throw new SetupError(`${label} row ${row} is ${text.length} wide, not ${width}`);

		return Array.from({ length: text.length }, (_, x) => text.charAt(x)).flatMap((character, x): Array<Block> => {
			if (character === FILLED) return [[x, row]];

			if (character === EMPTY) return [];

			throw new SetupError(`${label} row ${row} holds "${character}", not ${FILLED} or ${EMPTY}`);
		});
	});

const writeRows = (board: Board, item: Rows, index: number): void => {
	const cells = rowCells(item, board.width, itemLabel(index));

	if (item.rows.length > board.fullHeight) throw new SetupError(`${itemLabel(index)} is taller than the board`);

	for (const row of board.state.slice(0, item.rows.length)) row.fill(null);

	for (const cell of cells) {
		const [x, y] = cell;
		const row = board.state[y];

		if (row) row[x] = { mino: Mino.GARBAGE, connections: pieceConnections(cells, cell) };
	}
};

export const buildBoard = (board: Board, { board: items, validate }: GameSetup): void => {
	items.forEach((item, index) => {
		if (isPlacement(item)) addPlacement(board, item, validate, index);
		else if (isDig(item)) digRows(board, item);
		else if (isRows(item)) writeRows(board, item, index);
		else if (!isHold(item)) insertGarbage(board, item);
	});
};

export const playBoard = ({ board: items, validate }: GameSetup): BoardPlay => {
	const draws: Array<DrawnPiece> = [];
	let hold: Piece | null = null;
	let falling: Piece | null = null;
	let holdLocked = false;

	items.forEach((item, index) => {
		const label = itemLabel(index);

		if (isHold(item)) {
			if (validate && holdLocked)
				throw new SetupError(`${label} (hold ${item.hold.toUpperCase()}) holds again before a piece is placed`);

			if (falling !== item.hold) draws.push({ mino: item.hold, label });

			falling = hold;
			hold = item.hold;
			holdLocked = true;
		} else if (isPlacement(item)) {
			if (validate && falling !== null && falling !== item.mino)
				throw new SetupError(
					`${label} (${item.mino.toUpperCase()}) must place the ${falling.toUpperCase()} that came out of hold`,
				);

			if (falling !== item.mino) draws.push({ mino: item.mino, label });

			falling = null;
			holdLocked = false;
		}
	});

	return { draws, hold, falling, holdLocked };
};

const labelled = (pieces: ReadonlyArray<Piece>, label: string): Array<DrawnPiece> =>
	pieces.map((mino, index) => ({ mino, label: `${label} ${index + 1}` }));

export const queueRemainder = ({ queue }: GameSetup, { draws }: BoardPlay): Array<Piece> => {
	const queued = labelled(queue.pieces, "Queue piece");

	if (queue.mode === "any") return [];

	if (queue.mode === "fresh-bag") return bagRemainder(queued);

	return bagRemainder([...draws, ...queued]);
};
