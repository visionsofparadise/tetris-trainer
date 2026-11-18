import { cellsKey, type Block, type Move, type Piece, type ScriptStep, type SpinType } from "@tetris-trainer/game";
import { clearName } from "../../utils/clearName";

type SpinGoal = Exclude<SpinType, "none">;

export type Goal =
	| { readonly kind: "spot"; readonly cells: ReadonlyArray<Block>; readonly tuck: boolean }
	| { readonly kind: "spin"; readonly spin: SpinGoal; readonly lines: number };

export interface Landing {
	readonly cells: ReadonlyArray<Block>;
	readonly spin: SpinType;
	readonly lines: number;
	readonly softDropped: boolean;
}

export const hasSoftDrop = (keys: ReadonlyArray<ScriptStep>): boolean =>
	keys.some((step) => "hold" in step && step.hold === "softDrop");

const isSpot = (goal: Goal, cells: ReadonlyArray<Block>): boolean =>
	goal.kind === "spot" && cellsKey(cells) === cellsKey(goal.cells);

export const meetsGoal = (goal: Goal, { cells, spin, lines, softDropped }: Landing): boolean => {
	if (goal.kind === "spot") return isSpot(goal, cells) && (goal.tuck || !softDropped);

	return spin === goal.spin && lines === goal.lines;
};

const moveLanding = (move: Move): Landing => ({ ...move, softDropped: hasSoftDrop(move.keys) });

export const passingMoves = (goal: Goal, moves: ReadonlyArray<Move>): Array<Move> =>
	moves
		.filter((move) => (goal.kind === "spot" ? isSpot(goal, move.cells) : meetsGoal(goal, moveLanding(move))))
		.sort((first, second) => first.presses - second.presses);

export const goalName = (goal: Goal, mino: Piece): string => {
	if (goal.kind === "spot") return goal.tuck ? "Slide" : "Hard drop";

	return clearName({
		placement: { mino, orientation: "spawn", column: 0, row: 0 },
		lines: goal.lines,
		spin: goal.spin,
		isPerfectClear: false,
	});
};
