import {
	BOARD_COLUMNS,
	finesseTargets,
	Mino,
	placementCells,
	QUARTER_TURN_KEYS,
	ROTATION_KEYS,
	type GameSetup,
	type Orientation,
	type Piece,
	type PieceTarget,
	type Placement,
	type ScriptStep,
	type ShiftKey,
} from "@tetris-trainer/game";
import type { BoardMark } from "../../models/BoardMark";

export type RouteRule =
	| "drop"
	| "taps"
	| "turn"
	| "any-order"
	| "das"
	| "tap-back"
	| "gap"
	| "flush"
	| "toward-travel"
	| "south"
	| "verticals";

export const FINESSE_TARGETS: ReadonlyArray<PieceTarget> = finesseTargets();

export const FINESSE_PIECES: ReadonlyArray<Piece> = [...new Set(FINESSE_TARGETS.map(({ mino }) => mino))];

export const pieceSetup = (mino: Piece): GameSetup => ({
	board: [],
	validate: false,
	queue: { pieces: [mino], mode: "any" },
	holdEnabled: false,
});

const UPRIGHT_PIECES: ReadonlyArray<Piece> = [Mino.I, Mino.S, Mino.Z];

export const isUprightVertical = (mino: Piece, orientation: Orientation): boolean =>
	UPRIGHT_PIECES.includes(mino) && (orientation === "right" || orientation === "left");

export const opposite = (key: ShiftKey): ShiftKey => (key === "moveLeft" ? "moveRight" : "moveLeft");

export const isTurn = (step: ScriptStep, turns = ROTATION_KEYS): boolean => "tap" in step && turns.includes(step.tap);

export const targetPlacement = (target: PieceTarget): Placement => ({ ...target, row: 0 });

export const targetMarks = (target: PieceTarget): ReadonlyArray<BoardMark> => [
	{ cells: placementCells(targetPlacement(target)), tone: "target" },
];

export const touchesWall = (target: PieceTarget, key: ShiftKey): boolean => {
	const columns = placementCells(targetPlacement(target)).map(([x]) => x);

	return key === "moveLeft" ? Math.min(...columns) === 0 : Math.max(...columns) === BOARD_COLUMNS - 1;
};

const dasRules = (target: PieceTarget, route: ReadonlyArray<ScriptStep>): Array<RouteRule> => {
	const index = route.findIndex((step) => "das" in step);
	const das = route[index];

	if (das === undefined || !("das" in das)) return [];

	const wall = das.das;
	const before = route.slice(0, index);
	const after = route.slice(index + 1);
	const turnsAfter = after.some((step) => isTurn(step, QUARTER_TURN_KEYS));
	const isFlush = touchesWall(target, wall);

	return [
		"das",
		...(after.some((step) => "tap" in step && step.tap === opposite(wall)) ? ["tap-back" as const] : []),
		...(turnsAfter && !isFlush ? ["gap" as const] : []),
		...(before.some((step) => isTurn(step, QUARTER_TURN_KEYS)) && isFlush ? ["flush" as const] : []),
		...(turnsAfter ? ["toward-travel" as const] : []),
	];
};

const moveRules = (route: ReadonlyArray<ScriptStep>): Array<RouteRule> => {
	if (route.length === 0) return ["drop"];

	if (route.some((step) => "das" in step)) return [];

	if (route.every((step) => isTurn(step))) return ["turn"];

	return route.some((step) => isTurn(step)) ? ["taps", "any-order"] : ["taps"];
};

export const routeRules = (target: PieceTarget, route: ReadonlyArray<ScriptStep>): Array<RouteRule> => [
	...moveRules(route),
	...dasRules(target, route),
	...(target.orientation === "reverse" ? ["south" as const] : []),
	...(isUprightVertical(target.mino, target.orientation) ? ["verticals" as const] : []),
];
