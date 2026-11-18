import {
	BAG,
	Mino,
	type Block,
	type Mover,
	type MoveRules,
	type Piece,
	type QuadGoal,
	type SimBoard,
} from "@tetris-trainer/game";
import { deadRows } from "./boardFacts";
import type { WellStage } from "./stages";
import type { Player } from "../drill/Drill";

export const WELLS_GRAVITY = 0.02;

export const THREE_SIDE: ReadonlyArray<number> = [7, 8, 9];

const OLD_WELL = 9;

const LEFT_PIECES: ReadonlyArray<Piece> = [Mino.T, Mino.I];

export const goalOf = ({ well }: WellStage): QuadGoal => ({ well });

export const moverOf = ({ handling }: Player): Mover => ({ handling, gravity: WELLS_GRAVITY });

const threeSideFor = (stage: WellStage, mino: Piece): ReadonlyArray<number> =>
	stage.start === "convert" && mino === Mino.I ? THREE_SIDE.filter((column) => column !== OLD_WELL) : THREE_SIDE;

const excludedFor = (stage: WellStage, mino: Piece): ReadonlyArray<number> => [
	...(mino === Mino.I ? [] : [stage.well]),
	...(stage.layout === "6-3" && LEFT_PIECES.includes(mino) ? threeSideFor(stage, mino) : []),
];

export const wellsRules = (stage: WellStage, allow180: boolean, board: SimBoard): MoveRules => ({
	allow180,
	excluded: Object.fromEntries(BAG.map((mino) => [mino, excludedFor(stage, mino)])),
	holeFreeOnly: true,
	ceiling: stage.ceiling,
	quadClearsOnly: true,
	deadRows: deadRows(board, stage.well),
});

export const isWellMove = (
	mino: Piece,
	cells: ReadonlyArray<Block>,
	lines: number,
	stage: WellStage,
	board: SimBoard,
): boolean =>
	cells.some(([x, y]) => x === stage.well && y >= deadRows(board, stage.well)) && (mino !== Mino.I || lines === 0);

export const isWrongSide = (mino: Piece, cells: ReadonlyArray<Block>, stage: WellStage): boolean => {
	if (stage.layout !== "6-3" || !LEFT_PIECES.includes(mino)) return false;

	const side = threeSideFor(stage, mino);

	return cells.some(([x]) => side.includes(x));
};

export const isOverCeiling = (cells: ReadonlyArray<Block>, { ceiling }: WellStage): boolean =>
	ceiling !== null && cells.some(([, y]) => y >= ceiling);
