import { ignore } from "opshot";
import { DEMO_HANDLING, DEMO_PACING, loadOrder, planScript } from "./openerScript";
import { categorize, dealOrder, type Category, type OrderFilter } from "./orders";
import { impossibleReason, plan, startState, type Decision } from "./planner";
import type { Opener } from "./Opener";
import type { Banner } from "../../models/Banner";
import type { Game, Piece } from "@tetris-trainer/game";

export interface WatchSession {
	game: Game;
	filter: OrderFilter;
	order: Array<Piece>;
	category: Category;
	decisions: Array<Decision>;
	index: number;
	banner: Banner | null;
	speed: number;
	round: number;
	isDone: boolean;
}

export const initialWatch = (opener: Opener): WatchSession => {
	const order = dealOrder(opener, "no-hold");
	const game = loadOrder(DEMO_HANDLING, order);

	game.pause();

	return {
		game: ignore(game),
		filter: "no-hold",
		order,
		category: categorize(opener, order),
		decisions: [],
		index: 0,
		banner: null,
		speed: 1,
		round: 0,
		isDone: false,
	};
};

export const dealWatch = (session: WatchSession, opener: Opener): void => {
	const order = dealOrder(opener, session.filter);
	const decisions = plan(opener, startState(order));
	const game = loadOrder(DEMO_HANDLING, order);

	session.order = order;
	session.category = categorize(opener, order);
	session.decisions = decisions ?? [];
	session.index = 0;
	session.round++;
	session.isDone = decisions === null;
	game.setSpeed(session.speed);
	game.setUserInput(false);

	if (decisions === null) {
		game.pause();
		session.banner = {
			tone: "info",
			title: `${opener.name} isn't possible`,
			detail: impossibleReason(opener, order),
		};
	} else {
		const handleDecision = () => {
			session.index++;

			if (session.index < decisions.length) return;

			game.pause();
			session.isDone = true;
			session.banner = {
				tone: "success",
				title: `${opener.name} built`,
				detail: "The T-spin double clears two lines.",
			};
		};

		session.banner = null;
		game.input(planScript(decisions, DEMO_PACING));
		game.on("place", handleDecision);
		game.on("hold", handleDecision);
	}

	session.game = ignore(game);
};

export const setWatchFilter = (session: WatchSession, opener: Opener, filter: OrderFilter): void => {
	session.filter = filter;
	dealWatch(session, opener);
};

export const setWatchSpeed = (session: WatchSession, speed: number): void => {
	session.speed = speed;
	session.game.setSpeed(speed);
};
