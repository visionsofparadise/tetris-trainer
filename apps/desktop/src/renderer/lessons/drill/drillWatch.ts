import { simBoardOf, type Game } from "@tetris-trainer/game";
import { ignore } from "opshot";
import { searchStateOf } from "../../search/searchStateOf";
import { pausedGame } from "./pausedGame";
import type { Drill, JudgeContext } from "./Drill";
import type { BoardMark } from "../../models/BoardMark";
import type { BoardOverlay } from "../../models/BoardOverlay";

const NO_OVERLAYS: ReadonlyArray<BoardOverlay> = [];

export type DealWatch = NonNullable<Drill<unknown>["watch"]>;

export interface DrillWatchSession {
	game: Game;
	round: number;
	marks: ReadonlyArray<BoardMark>;
	overlays: ReadonlyArray<BoardOverlay>;
	narration: ReadonlyArray<string>;
	speed: number;
	isDone: boolean;
	clears: number;
	abort: AbortController;
}

export const createDrillWatch = (): DrillWatchSession => {
	const game = pausedGame();

	return {
		game: ignore(game),
		round: 0,
		marks: [],
		overlays: NO_OVERLAYS,
		narration: [],
		speed: 1,
		isDone: false,
		clears: 0,
		abort: ignore(new AbortController()),
	};
};

export const stopDrillWatch = (session: DrillWatchSession): void => {
	session.abort.abort();
	session.game.pause();
};

export const dealDrillWatch = (session: DrillWatchSession, watch: DealWatch, context: JudgeContext): void => {
	const { game, locks, marks, overlays, narration, play } = watch(context.player, context.search, session.round);
	const abort = new AbortController();
	let placed = 0;

	const showBoard = (): void => {
		session.overlays = ignore(overlays ? overlays(simBoardOf(game.board)) : NO_OVERLAYS);
	};

	const isActive = (): boolean => session.game === game && !abort.signal.aborted;

	const finish = (): void => {
		game.pause();
		session.isDone = true;
	};

	const playTurn = async (): Promise<void> => {
		game.pause();

		try {
			const { steps, line } = await play(searchStateOf(game), abort.signal);

			if (!isActive()) return;

			game.input(steps);

			if (line !== null) session.narration = [...session.narration, line];

			game.resume();
		} catch (error) {
			if (abort.signal.aborted) return;

			console.error("The Watch round could not play its piece", error);

			if (isActive()) finish();
		}
	};

	game.setSpeed(session.speed);
	game.setUserInput(false);
	game.on("spawn", ({ fromHold }) => {
		if (isActive() && !fromHold && placed < locks) void playTurn();
	});
	game.on("place", () => {
		if (!isActive()) return;

		placed++;
		showBoard();

		if (placed < locks) return;

		finish();
		session.clears++;
	});

	session.abort.abort();
	session.abort = ignore(abort);
	session.round++;
	session.marks = ignore(marks);
	showBoard();
	session.narration = narration;
	session.isDone = false;
	session.game = ignore(game);
	void playTurn();
};

export const setDrillWatchSpeed = (session: DrillWatchSession, speed: number): void => {
	session.speed = speed;
	session.game.setSpeed(speed);
};
