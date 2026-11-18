import { rowsReady, VISIBLE_ROWS, type Block, type SimBoard } from "@tetris-trainer/game";
import { wellFloor } from "./boardFacts";
import { THREE_SIDE } from "./rules";
import type { WellStage } from "./stages";
import type { BoardOverlay } from "../../models/BoardOverlay";

const WINDOW_ROWS = 4;

const columnCells = (columns: ReadonlyArray<number>): ReadonlyArray<Block> =>
	columns.flatMap((x) => Array.from({ length: VISIBLE_ROWS }, (_, y): Block => [x, y]));

export const fourCount = (board: SimBoard, stage: WellStage): BoardOverlay => {
	const ready = rowsReady(board, { well: stage.well });

	return {
		kind: "rowLine",
		row: wellFloor(board, stage.well) + WINDOW_ROWS,
		tone: ready === WINDOW_ROWS ? "lime" : "muted",
		label: ready === WINDOW_ROWS ? "Quad ready" : `${ready} / 4 rows ready`,
	};
};

export const wellTint = (well: number): BoardOverlay => ({ kind: "tint", cells: columnCells([well]), tone: "muted" });

const sideTints = (stage: WellStage): ReadonlyArray<BoardOverlay> => [
	wellTint(stage.well),
	...(stage.layout === "6-3"
		? [{ kind: "tint" as const, cells: columnCells(THREE_SIDE), tone: "lime" as const }]
		: []),
];

const ceilingLine = ({ ceiling }: WellStage): ReadonlyArray<BoardOverlay> =>
	ceiling === null ? [] : [{ kind: "rowLine", row: ceiling, tone: "pink", label: "Ceiling" }];

export const wellOverlays = (stage: WellStage, board: SimBoard): ReadonlyArray<BoardOverlay> => [
	...sideTints(stage),
	...ceilingLine(stage),
	fourCount(board, stage),
];
