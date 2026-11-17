import {
	BOARD_COLUMNS,
	finesseTargets,
	Mino,
	placementCells,
	QUARTER_TURN_KEYS,
	ROTATION_KEYS,
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

export const FINESSE_PIECES: ReadonlyArray<Piece> = [Mino.O, Mino.I, Mino.T, Mino.J, Mino.L, Mino.S, Mino.Z];

export const FINESSE_TARGETS: ReadonlyArray<PieceTarget> = finesseTargets();

export const TARGETS_BY_PIECE: ReadonlyMap<Piece, ReadonlyArray<PieceTarget>> = new Map(
	FINESSE_PIECES.map((mino) => [mino, FINESSE_TARGETS.filter((target) => target.mino === mino)]),
);

export const RULE_TEXT: Record<RouteRule, string> = {
	drop: "The piece spawns over its spot, so it only needs the drop.",
	taps: "A spot one or two columns away takes that many taps.",
	turn: "A turn alone reaches this spot.",
	"any-order": "Away from the walls, the turn and the taps can come in either order.",
	das: "Hold the move key to DAS: one press slides the piece to the wall.",
	"tap-back": "DAS, then tap back: two presses where taps would take three or more.",
	gap: "Turning after the DAS leaves a gap at the wall.",
	flush: "Turning before the DAS lets the piece sit flush against the wall.",
	"toward-travel": "After a DAS, turn the way the piece should go: CW steps it right, CCW steps it left.",
	south: "Upside down is a 180 (or two turns), then the flat keys.",
	verticals: "S, Z and I stand up in two columns, so pick the turn that lands on the target.",
};

const UPRIGHT_PIECES: ReadonlyArray<Piece> = [Mino.I, Mino.S, Mino.Z];

const opposite = (key: ShiftKey): ShiftKey => (key === "moveLeft" ? "moveRight" : "moveLeft");

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
	...(UPRIGHT_PIECES.includes(target.mino) && (target.orientation === "right" || target.orientation === "left")
		? ["verticals" as const]
		: []),
];
