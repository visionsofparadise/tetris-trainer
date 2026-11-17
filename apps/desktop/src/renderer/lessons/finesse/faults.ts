import {
	cellsKey,
	finesseRoutes,
	isDasPress,
	minimalPresses,
	ORIENTATIONS,
	pathCells,
	playerPresses,
	pressesReach,
	pressesToSteps,
	routeCells,
	SHIFT_KEYS,
	stepsMoved,
	type Block,
	type GameKey,
	type KeyPress,
	type Orientation,
	type PieceTarget,
	type ScriptStep,
	type ShiftKey,
} from "@tetris-trainer/game";
import { isTurn, isUprightVertical, opposite, touchesWall } from "./targets";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { Tone } from "../../models/Tone";
import type { KeyComparison, Player } from "../drill/Drill";

type FaultKind =
	| "wrong-spot"
	| "partial-das"
	| "floor-kick"
	| "wrong-rotation"
	| "tapped-across"
	| "three-taps"
	| "rotated-before-das"
	| "extra-press";

export interface Fault {
	readonly kind: FaultKind;
	readonly title: string;
	readonly keys: KeyComparison;
	readonly overlays: ReadonlyArray<BoardOverlay>;
}

const FAULT_TITLES: Record<FaultKind, string> = {
	"wrong-spot": "Wrong spot",
	"partial-das": "Partial DAS",
	"floor-kick": "Floor kick",
	"wrong-rotation": "Wrong rotation",
	"tapped-across": "Tapped across",
	"three-taps": "Three taps",
	"rotated-before-das": "Rotated before DAS",
	"extra-press": "Extra press",
};

const TURN_STEPS: Partial<Record<GameKey, number>> = { rotateCW: 1, rotate180: 2, rotateCCW: 3 };

const THREE_TAPS = 3;

const stepToken = (step: ScriptStep): string => {
	if ("das" in step) return `das ${step.das}`;

	return "tap" in step ? step.tap : JSON.stringify(step);
};

const editDistance = (first: ReadonlyArray<string>, second: ReadonlyArray<string>): number => {
	let row = second.map((_, index) => index + 1);
	let diagonal = 0;

	first.forEach((token, firstIndex) => {
		const next = [firstIndex + 1];

		diagonal = firstIndex;
		second.forEach((other, secondIndex) => {
			next.push(
				Math.min((next[secondIndex] ?? 0) + 1, (row[secondIndex] ?? 0) + 1, diagonal + (token === other ? 0 : 1)),
			);
			diagonal = row[secondIndex] ?? 0;
		});
		row = next.slice(1);
	});

	return row.at(-1) ?? first.length;
};

const turnsOf = (steps: ReadonlyArray<ScriptStep>): string =>
	steps
		.filter((step) => isTurn(step))
		.map(stepToken)
		.join(" ");

interface NearRoute {
	readonly route: ReadonlyArray<ScriptStep>;
	readonly distance: number;
	readonly mismatch: number;
}

export const nearestRoute = (
	routes: ReadonlyArray<ReadonlyArray<ScriptStep>>,
	steps: ReadonlyArray<ScriptStep>,
): ReadonlyArray<ScriptStep> => {
	const tokens = steps.map(stepToken);
	const turns = turnsOf(steps);

	return routes.reduce<NearRoute>(
		(best, route) => {
			const distance = editDistance(tokens, route.map(stepToken));
			const mismatch = turnsOf(route) === turns ? 0 : 1;

			return distance < best.distance || (distance === best.distance && mismatch < best.mismatch)
				? { route, distance, mismatch }
				: best;
		},
		{ route: [], distance: Infinity, mismatch: 1 },
	).route;
};

const finalOrientation = (route: ReadonlyArray<ScriptStep>): Orientation =>
	ORIENTATIONS[
		route.reduce((turns, step) => turns + ("tap" in step ? (TURN_STEPS[step.tap] ?? 0) : 0), 0) % ORIENTATIONS.length
	] ?? "spawn";

const turnCount = (presses: ReadonlyArray<KeyPress>, player: Player): number =>
	playerPresses(
		presses.filter((press) => press.key in TURN_STEPS),
		player,
	);

const firstIndex = (steps: ReadonlyArray<ScriptStep>, test: (step: ScriptStep) => boolean): number => {
	const index = steps.findIndex(test);

	return index === -1 ? Infinity : index;
};

const isDas = (step: ScriptStep): boolean => "das" in step;

const dasesFirst = (route: ReadonlyArray<ScriptStep>): boolean => {
	const das = firstIndex(route, isDas);
	const turn = firstIndex(route, (step) => isTurn(step));

	return das < turn && turn !== Infinity;
};

const isSoftDrop = (press: KeyPress): boolean => press.source === "user" && press.key === "softDrop";

const tapsOf = (route: ReadonlyArray<ScriptStep>, key: GameKey): number =>
	route.filter((step) => "tap" in step && step.tap === key).length;

export interface Attempt {
	readonly target: PieceTarget;
	readonly orientation: Orientation;
	readonly presses: ReadonlyArray<KeyPress>;
}

const faultKind = (
	{ target, orientation, presses }: Attempt,
	player: Player,
	steps: ReadonlyArray<ScriptStep>,
	routes: ReadonlyArray<ReadonlyArray<ScriptStep>>,
): FaultKind => {
	const user = presses.filter((press) => press.source === "user" && !press.carried);

	if (user.some((press) => isDasPress(press, player.handling) && !press.blocked)) return "partial-das";

	if (playerPresses(user, player) < minimalPresses(target, player) || !pressesReach(target, user, player.handling))
		return "floor-kick";

	const turns = turnCount(user, player);
	const turnKeys = user.map(({ key }) => key);
	const isOneWay = !(turnKeys.includes("rotateCW") && turnKeys.includes("rotateCCW"));
	const isLongWay = routes.some(
		(route) =>
			route.some((step) => isTurn(step)) &&
			finalOrientation(route) === orientation &&
			turns > route.filter((step) => isTurn(step)).length,
	);
	const isOtherVertical =
		isUprightVertical(target.mino, orientation) && !routes.some((route) => finalOrientation(route) === orientation);

	if ((isOneWay && isLongWay) || isOtherVertical) return "wrong-rotation";

	if (
		SHIFT_KEYS.some(
			(key) =>
				touchesWall(target, key) &&
				steps.some((step) => "tap" in step && step.tap === key) &&
				!steps.some((step) => "das" in step && step.das === key),
		)
	)
		return "tapped-across";

	const moved = stepsMoved(target.mino, steps);
	const tapRun = (key: ShiftKey): number =>
		steps.reduce(
			({ run, longest }, step, index) => {
				if (!moved[index] || isTurn(step)) return { run, longest };

				const next = "tap" in step && step.tap === key ? run + 1 : 0;

				return { run: next, longest: Math.max(longest, next) };
			},
			{ run: 0, longest: 0 },
		).longest;
	const isThreeTaps = (key: ShiftKey): boolean => {
		const taps = tapRun(key);

		return (
			taps >= THREE_TAPS &&
			routes.some(
				(route) =>
					route.some((step) => "das" in step && step.das === key) && 1 + tapsOf(route, opposite(key)) < taps,
			)
		);
	};

	if (SHIFT_KEYS.some(isThreeTaps)) return "three-taps";

	if (
		steps.some(isDas) &&
		firstIndex(steps, (step) => isTurn(step)) < firstIndex(steps, isDas) &&
		routes.every(dasesFirst)
	)
		return "rotated-before-das";

	return "extra-press";
};

const yoursOf = (presses: ReadonlyArray<KeyPress>, player: Player): Array<ScriptStep> =>
	presses
		.filter((press) => press.source === "user" && !press.carried)
		.sort((first, second) => first.down - second.down)
		.flatMap((press) => (isSoftDrop(press) ? [{ tap: press.key }] : pressesToSteps([press], player.handling)));

const compared = (attempt: Attempt, player: Player) => {
	const routes = finesseRoutes(attempt.target, player);
	const steps = pressesToSteps(attempt.presses, player.handling);

	return { routes, steps, nearest: nearestRoute(routes, steps) };
};

const numberedGhosts = (path: ReadonlyArray<ReadonlyArray<Block>>, tone: Tone): Array<BoardOverlay> => {
	const spots = new Map<string, { readonly cells: ReadonlyArray<Block>; readonly numbers: Array<number> }>();

	path.forEach((cells, index) => {
		const key = cellsKey(cells);
		const spot = spots.get(key) ?? { cells, numbers: [] };

		spot.numbers.push(index + 1);
		spots.set(key, spot);
	});

	return [...spots.values()].map(({ cells, numbers }) => ({ kind: "ghost", cells, tone, label: numbers.join(",") }));
};

const pathGhosts = (
	{ target, presses }: Attempt,
	player: Player,
	nearest: ReadonlyArray<ScriptStep>,
): Array<BoardOverlay> => [
	...numberedGhosts(pathCells(presses, player.handling, target.mino), "pink"),
	...numberedGhosts(routeCells(nearest, target.mino), "lime"),
];

const faultOf = (kind: FaultKind, attempt: Attempt, player: Player, nearest: ReadonlyArray<ScriptStep>): Fault => ({
	kind,
	title: FAULT_TITLES[kind],
	keys: { yours: yoursOf(attempt.presses, player), minimal: nearest },
	overlays: kind === "wrong-spot" ? [] : pathGhosts(attempt, player, nearest),
});

export const wrongSpot = (attempt: Attempt, player: Player): Fault =>
	faultOf("wrong-spot", attempt, player, compared(attempt, player).nearest);

export const findFault = (attempt: Attempt, player: Player): Fault | null => {
	const { presses, target } = attempt;
	const isMinimal =
		playerPresses(presses, player) === minimalPresses(target, player) &&
		!presses.some(isSoftDrop) &&
		presses.every(
			(press) => press.source !== "user" || press.carried || !isDasPress(press, player.handling) || press.blocked,
		) &&
		pressesReach(target, presses, player.handling);

	if (isMinimal) return null;

	const { routes, steps, nearest } = compared(attempt, player);

	return faultOf(faultKind(attempt, player, steps, routes), attempt, player, nearest);
};
