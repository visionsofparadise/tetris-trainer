import {
	BAG,
	cellsKey,
	generateMoves,
	homeless,
	lockCells,
	Mino,
	windowFill,
	type Move,
	type Mover,
	type MoveRules,
	type Piece,
	type QuadGoal,
	type ScriptStep,
	type SearchResult,
	type SearchState,
	type SimBoard,
} from "@tetris-trainer/game";
import { bumpiness, coveredCells, deepPits, stackHeight } from "./boardFacts";
import { goalOf, isWellMove, THREE_SIDE } from "./rules";
import type { WellStage } from "./stages";

interface Ranked {
	readonly move: Move;
	readonly key: ReadonlyArray<number>;
}

const QUAD_LINES = 4;

const HARD_DROP: ReadonlyArray<ScriptStep> = [{ tap: "hardDrop" }];

const HOLD: ReadonlyArray<ScriptStep> = [{ tap: "hold" }];

const leftmost = ({ cells }: Move): number => Math.min(...cells.map(([x]) => x));

const compareKeys = (first: ReadonlyArray<number>, second: ReadonlyArray<number>): number => {
	for (const [index, value] of first.entries()) {
		const difference = value - (second[index] ?? 0);

		if (difference !== 0) return difference;
	}

	return 0;
};

const rank = (move: Move, board: SimBoard, covered: number, goal: QuadGoal, rules: MoveRules): Ranked => {
	const lock = lockCells(board, move.cells, move.spin);
	const added = coveredCells(lock.added) - covered;

	return {
		move,
		key: [
			added,
			move.lines === QUAD_LINES ? 0 : 1,
			deepPits(lock.board, goal.well),
			move.placement.mino === Mino.I ? 1 : 0,
			homeless(lock.board, BAG, rules).length,
			bumpiness(lock.board, goal.well),
			-windowFill(lock.board, goal),
			stackHeight(lock.board),
			move.presses,
			leftmost(move),
		],
	};
};

export const pickMove = (
	candidates: ReadonlyArray<Move>,
	board: SimBoard,
	goal: QuadGoal,
	rules: MoveRules,
): Move | null => {
	const covered = coveredCells(board);
	const [best] = candidates
		.map((move) => rank(move, board, covered, goal, rules))
		.sort((first, second) => compareKeys(first.key, second.key));

	return best?.move ?? null;
};

export const candidatesFor = (
	board: SimBoard,
	mino: Piece,
	stage: WellStage,
	rules: MoveRules,
	mover: Mover,
): Array<Move> =>
	generateMoves(board, mino, { ...rules, holeFreeOnly: false }, mover).filter(
		({ cells, lines }) => !isWellMove(cells, lines, stage),
	);

const isThreeSide = ({ cells }: Move): boolean => cells.every(([x]) => THREE_SIDE.includes(x));

const poolOf = (stage: WellStage, candidates: ReadonlyArray<Move>): ReadonlyArray<Move> => {
	if (stage.id !== "six-side") return candidates;

	const threeSide = candidates.filter(isThreeSide);

	return threeSide.length > 0 ? threeSide : candidates;
};

export interface Choice {
	readonly move: Move;
	readonly hold: boolean;
}

interface Option {
	readonly piece: Piece;
	readonly hold: boolean;
}

const optionsOf = (spawn: SearchState, canHold: boolean): ReadonlyArray<Option> => {
	const held = spawn.hold ?? spawn.queue[0];
	const holds = canHold && spawn.holdEnabled && !spawn.holdLocked && held !== undefined && held !== spawn.current;

	return [{ piece: spawn.current, hold: false }, ...(holds ? [{ piece: held, hold: true }] : [])];
};

export const chooseMove = (
	spawn: SearchState,
	before: SearchResult,
	stage: WellStage,
	rules: MoveRules,
	mover: Mover,
	canHold: boolean,
): Choice | null => {
	const holds = new Map<Move, boolean>();
	const pools = optionsOf(spawn, canHold).map(({ piece, hold }) => {
		const pool = poolOf(stage, candidatesFor(spawn.board, piece, stage, rules, mover));

		pool.forEach((move) => holds.set(move, hold));

		return { hold, keys: new Set(pool.map(({ cells }) => cellsKey(cells))), pool };
	});
	const tied =
		before.kind === "reached"
			? before.firstSteps.flatMap(({ kind, move }) => {
					const pool = pools.find(({ hold }) => hold === (kind === "hold"));

					if (!pool?.keys.has(cellsKey(move.cells))) return [];

					holds.set(move, pool.hold);

					return [move];
				})
			: [];
	const move = pickMove(tied.length > 0 ? tied : pools.flatMap(({ pool }) => pool), spawn.board, goalOf(stage), rules);

	return move ? { move, hold: holds.get(move) ?? false } : null;
};

export const choiceKeys = (choice: Choice | null): ReadonlyArray<ScriptStep> =>
	choice === null ? HARD_DROP : [...(choice.hold ? HOLD : []), ...choice.move.keys];
