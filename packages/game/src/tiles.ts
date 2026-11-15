import { BoardConnections, type Mino, type Tile } from "@haelp/teto/engine";
import type { Block } from "./pieces";

export interface TileEdges {
	readonly top: boolean;
	readonly right: boolean;
	readonly bottom: boolean;
	readonly left: boolean;
}

export interface BoardTile {
	readonly mino: Mino;
	readonly edges: TileEdges;
}

const has = (cells: ReadonlyArray<Block>, x: number, y: number): boolean =>
	cells.some(([cellX, cellY]) => cellX === x && cellY === y);

export const pieceConnections = (cells: ReadonlyArray<Block>, [x, y]: Block): number =>
	(has(cells, x, y + 1) ? 0 : BoardConnections.TOP) |
	(has(cells, x + 1, y) ? 0 : BoardConnections.RIGHT) |
	(has(cells, x, y - 1) ? 0 : BoardConnections.BOTTOM) |
	(has(cells, x - 1, y) ? 0 : BoardConnections.LEFT);

export const boardTile = (tile: Tile): BoardTile | null =>
	tile && {
		mino: tile.mino,
		edges: {
			top: (tile.connections & BoardConnections.TOP) !== 0,
			right: (tile.connections & BoardConnections.RIGHT) !== 0,
			bottom: (tile.connections & BoardConnections.BOTTOM) !== 0,
			left: (tile.connections & BoardConnections.LEFT) !== 0,
		},
	};
