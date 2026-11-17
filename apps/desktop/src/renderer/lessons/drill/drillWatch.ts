import { DEFAULT_CONFIG, Game } from "@tetris-trainer/game";
import { ignore } from "opshot";
import type { Player, WatchRound } from "./Drill";
import type { BoardMark } from "../../models/BoardMark";

export type DealWatch = (player: Player, round: number) => WatchRound;

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
	const game = new Game(DEFAULT_CONFIG.handling);

	game.pause();

	return { game: ignore(game), round: 0, marks: [], narration: [], speed: 1, isDone: false, clears: 0 };
};

export const dealDrillWatch = (session: DrillWatchSession, watch: DealWatch, player: Player): void => {
	const round = session.round + 1;
	const { game, steps, locks, marks, narration } = watch(player, round);
	let placed = 0;

	game.setSpeed(session.speed);
	game.setUserInput(false);
	game.input(steps);
	game.on("place", () => {
		if (session.game !== game) return;

		placed++;

		if (placed < locks) return;

		game.pause();
		session.isDone = true;
		session.clears++;
	});

	session.round = round;
	session.marks = ignore(marks);
	session.narration = narration;
	session.isDone = false;
	session.game = ignore(game);
};

export const setDrillWatchSpeed = (session: DrillWatchSession, speed: number): void => {
	session.speed = speed;
	session.game.setSpeed(speed);
};
