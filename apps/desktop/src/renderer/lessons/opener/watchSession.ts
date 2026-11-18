import { ignore } from "opshot";
import { DEMO_HANDLING, DEMO_PACING, loadOrder, planScript } from "./openerScript";
import { dealOrder, type OrderFilter } from "./orders";
import { startState } from "./planState";
import type { Category, Decision, Opener } from "./Opener";
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
	clears: number;
}

export const initialWatch = (opener: Opener): WatchSession => {
	const { order, category } = dealOrder(opener, "no-hold");
	const game = loadOrder(DEMO_HANDLING, order);

	game.pause();

	return {
		game: ignore(game),
		filter: "no-hold",
		order,
		category,
		decisions: [],
		index: 0,
		banner: null,
		speed: 1,
		round: 0,
		isDone: false,
		clears: 0,
	};
};

export const dealWatch = (session: WatchSession, opener: Opener, pool: OrderFilter = session.filter): void => {
	const { order, category } = dealOrder(opener, pool);
	const decisions = opener.plan(startState(order));
	const game = loadOrder(DEMO_HANDLING, order);

	session.order = order;
	session.category = category;
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
			detail: "No way of placing and holding these pieces builds it.",
		};
	} else {
		const handleDecision = () => {
			if (session.game !== game) return;

			session.index++;

			if (session.index < decisions.length) return;

			game.pause();
			session.clears++;
			dealWatch(session, opener, pool);
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
