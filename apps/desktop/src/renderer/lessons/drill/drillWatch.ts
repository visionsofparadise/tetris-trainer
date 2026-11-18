import { ignore } from "opshot";
import { searchStateOf } from "../../search/searchStateOf";
import { pausedGame } from "./pausedGame";
import type { Drill, JudgeContext } from "./Drill";
import type { BoardMark } from "../../models/BoardMark";
import type { Game } from "@tetris-trainer/game";

export type DealWatch = NonNullable<Drill<unknown>["watch"]>;

export interface DrillWatchSession {
	game: Game;
	round: number;
	marks: ReadonlyArray<BoardMark>;
	narration: ReadonlyArray<string>;
	speed: number;
	isDone: boolean;
	clears: number;
}

export const createDrillWatch = (): DrillWatchSession => {
	const game = pausedGame();

	return { game: ignore(game), round: 0, marks: [], narration: [], speed: 1, isDone: false, clears: 0 };
};

export const dealDrillWatch = (session: DrillWatchSession, watch: DealWatch, context: JudgeContext): void => {
	const { game, locks, marks, narration, play } = watch(context.player, context.search, session.round);
	let placed = 0;

	const isActive = (): boolean => session.game === game;

	const finish = (): void => {
		game.pause();
		session.isDone = true;
	};

	const playTurn = async (): Promise<void> => {
		game.pause();

		try {
			const { steps, line } = await play(searchStateOf(game));

			if (!isActive()) return;

			game.input(steps);

			if (line !== null) session.narration = [...session.narration, line];

			game.resume();
		} catch (error) {
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

		if (placed < locks) return;

		finish();
		session.clears++;
	});

	session.round++;
	session.marks = ignore(marks);
	session.narration = narration;
	session.isDone = false;
	session.game = ignore(game);
	void playTurn();
};

export const setDrillWatchSpeed = (session: DrillWatchSession, speed: number): void => {
	session.speed = speed;
	session.game.setSpeed(speed);
};
