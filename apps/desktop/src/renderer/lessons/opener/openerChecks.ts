import { DEMO_HANDLING, samePlacement, type Game, type PlaceEvent, type Piece } from "@tetris-trainer/game";
import { loadOrder, loadSlide, planScript } from "./openerScript";
import { ordersByCategory } from "./orders";
import { plan, startState } from "./planner";
import type { Opener } from "./Opener";

const INSTANT = { keyWait: 0, decisionWait: 0 };
const FRAME_LIMIT = 3000;

export const playUntilPaused = (game: Game): void => {
	for (let frame = 0; frame < FRAME_LIMIT && !game.isPaused; frame++) game.step();
};

export const playPlan = (opener: Opener, order: ReadonlyArray<Piece>): Array<PlaceEvent> => {
	const decisions = plan(opener, startState(order)) ?? [];
	const places = decisions.filter((decision) => decision.kind === "place").length;
	const game = loadOrder(DEMO_HANDLING, order);
	const placed: Array<PlaceEvent> = [];

	game.on("place", (event) => {
		placed.push(event);

		if (placed.length === places) game.pause();
	});
	game.input(planScript(decisions, INSTANT));
	playUntilPaused(game);

	return placed;
};

const slideProblems = ({ slides }: Opener): Array<string> =>
	slides.flatMap((slide) => {
		try {
			loadSlide(slide);

			return [];
		} catch (error) {
			return [`Slide "${slide.title}" fails to load: ${String(error)}`];
		}
	});

const orderProblem = (opener: Opener, order: ReadonlyArray<Piece>): Array<string> => {
	const positions = (plan(opener, startState(order)) ?? []).flatMap((decision) =>
		decision.kind === "place" ? [decision.position.placement] : [],
	);
	const placed = playPlan(opener, order);
	const isBuilt =
		placed.length === positions.length &&
		placed.every(({ placement }, index) => {
			const position = positions[index];

			return position !== undefined && samePlacement(placement, position);
		});

	return isBuilt ? [] : [`Order ${order.join("").toUpperCase()} misses its positions`];
};

export const openerProblems = (opener: Opener): Array<string> => {
	const { "no-hold": noHold, hold } = ordersByCategory(opener);

	return [...slideProblems(opener), ...[...noHold, ...hold].flatMap((order) => orderProblem(opener, order))];
};
