import { cellsKey, generateMoves, type Move, type PlaceEvent, type SimBoard } from "@tetris-trainer/game";
import { moveRules, type TargetRound } from "./families";
import { meetsGoal, passingMoves, type Goal, type Landing } from "./goal";
import type { DrillMistake, Player } from "../drill/Drill";

type Call = Pick<DrillMistake, "kind" | "title" | "detail">;

const SOFT_DROP: Call = { kind: "soft-drop", title: "Soft dropped" };

const HARD_DROP: Call = { kind: "hard-drop", title: "Hard dropped" };

const WRONG_SPOT: Call = { kind: "wrong-spot", title: "Wrong spot" };

const NO_SPIN: Call = { kind: "no-spin", title: "No spin" };

const MINI: Call = { kind: "mini", title: "Mini" };

export const playerMoves = (board: SimBoard, round: TargetRound, { handling, allow180 }: Player): Array<Move> =>
	generateMoves(board, round.mino, moveRules(allow180), { handling, gravity: 0 });

export const landingOf = ({ cells, spin, lines, inputs }: PlaceEvent): Landing => ({
	cells,
	spin,
	lines,
	softDropped: inputs.some(({ key }) => key === "softDrop"),
});

const fewerLines = (lines: number, goal: number): Call => ({
	kind: "fewer-lines",
	title: "Fewer lines",
	detail: `Cleared ${lines}. This board clears ${goal}.`,
});

const spinCall = (goal: Extract<Goal, { kind: "spin" }>, landing: Landing, passing: ReadonlyArray<Move>): Call => {
	const key = cellsKey(landing.cells);
	const isSlot = passing.some(({ cells }) => cellsKey(cells) === key);

	if (isSlot) return landing.spin === "none" ? NO_SPIN : MINI;

	if (landing.spin === "mini" && goal.spin === "normal") return MINI;

	if (landing.spin === goal.spin && landing.lines < goal.lines) return fewerLines(landing.lines, goal.lines);

	return WRONG_SPOT;
};

export const callOf = (goal: Goal, landing: Landing, passing: ReadonlyArray<Move>): Call | null => {
	if (meetsGoal(goal, landing)) return null;

	if (goal.kind === "spin") return spinCall(goal, landing, passing);

	const isTarget = cellsKey(landing.cells) === cellsKey(goal.cells);

	if (!goal.tuck) return isTarget ? SOFT_DROP : WRONG_SPOT;

	return landing.softDropped ? WRONG_SPOT : HARD_DROP;
};

export const judgeLanding = (
	round: TargetRound,
	event: PlaceEvent,
	before: SimBoard,
	player: Player,
): DrillMistake | null => {
	const landing = landingOf(event);
	const passing = passingMoves(round.goal, playerMoves(before, round, player));
	const call = event.placement.mino === round.mino ? callOf(round.goal, landing, passing) : WRONG_SPOT;

	if (call === null) return null;

	const best = round.goal.kind === "spot" ? round.target : (passing[0]?.placement ?? null);
	const showsBefore = event.lines > 0;

	return {
		...call,
		placed: event.cells,
		best,
		showsBefore,
		overlays: showsBefore ? [{ kind: "tint", cells: event.cells, tone: "pink" }] : [],
	};
};
