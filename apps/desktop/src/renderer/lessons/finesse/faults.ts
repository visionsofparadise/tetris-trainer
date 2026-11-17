import {
	finesseRoutes,
	isDasPress,
	minimalPresses,
	ORIENTATIONS,
	playerPresses,
	pressesToSteps,
	SHIFT_KEYS,
	stepsMoved,
	type GameKey,
	type KeyPress,
	type Orientation,
	type PieceTarget,
	type ScriptStep,
} from "@tetris-trainer/game";
import { isTurn, touchesWall } from "./targets";
import type { KeyComparison, Player } from "../drill/Drill";

type FaultKind =
	| "wrong-spot"
	| "partial-das"
	| "wrong-rotation"
	| "tapped-across"
	| "three-taps"
	| "rotated-before-das"
	| "extra-press";

export interface Fault {
	readonly kind: FaultKind;
	readonly title: string;
	readonly keys: KeyComparison;
}

const FAULT_TITLES: Record<FaultKind, string> = {
	"wrong-spot": "Wrong spot",
	"partial-das": "Partial DAS",
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
	nearest: ReadonlyArray<ScriptStep>,
): FaultKind => {
	const user = presses.filter((press) => press.source === "user" && !press.carried);

	if (user.some((press) => isDasPress(press, player.handling) && !press.blocked)) return "partial-das";

	if (
		turnCount(user, player) > nearest.filter((step) => isTurn(step)).length ||
		!routes.some((route) => finalOrientation(route) === orientation)
	)
		return "wrong-rotation";

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
	const movingTaps = (key: GameKey): number =>
		steps.filter((step, index) => "tap" in step && step.tap === key && moved[index]).length;

	if (SHIFT_KEYS.some((key) => movingTaps(key) >= THREE_TAPS)) return "three-taps";

	if (
		steps.some(isDas) &&
		firstIndex(steps, (step) => isTurn(step)) < firstIndex(steps, isDas) &&
		routes.every(dasesFirst)
	)
		return "rotated-before-das";

	return "extra-press";
};

const faultOf = (kind: FaultKind, steps: ReadonlyArray<ScriptStep>, nearest: ReadonlyArray<ScriptStep>): Fault => ({
	kind,
	title: FAULT_TITLES[kind],
	keys: { yours: steps, minimal: nearest },
});

const compared = (attempt: Attempt, player: Player) => {
	const routes = finesseRoutes(attempt.target, player);
	const steps = pressesToSteps(attempt.presses, player.handling);

	return { routes, steps, nearest: nearestRoute(routes, steps) };
};

export const wrongSpot = (attempt: Attempt, player: Player): Fault => {
	const { steps, nearest } = compared(attempt, player);

	return faultOf("wrong-spot", steps, nearest);
};

export const findFault = (attempt: Attempt, player: Player): Fault | null => {
	const { presses, target } = attempt;
	const isMinimal =
		playerPresses(presses, player) <= minimalPresses(target, player) &&
		presses.every(
			(press) => press.source !== "user" || press.carried || !isDasPress(press, player.handling) || press.blocked,
		);

	if (isMinimal) return null;

	const { routes, steps, nearest } = compared(attempt, player);

	return faultOf(faultKind(attempt, player, steps, routes, nearest), steps, nearest);
};
