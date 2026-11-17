import { ignore } from "opshot";
import { pausedGame } from "./pausedGame";
import type { Drill, DrillMistake, DrillRound, DrillStage, Player } from "./Drill";
import type { Game, GameSnapshot } from "@tetris-trainer/game";

type DrillStatus = "playing" | "mistake";

export interface DrillSession<S, T extends DrillStage = DrillStage> {
	game: Game;
	state: S;
	stage: T;
	checkpoint: GameSnapshot;
	status: DrillStatus;
	mistake: DrillMistake | null;
	clears: number;
	passed: ReadonlyArray<string>;
}

const TOP_OUT: DrillMistake = { kind: "top-out", title: "Top out", placed: null, best: null };

export const createDrillSession = <S, T extends DrillStage>(drill: Drill<S, T>): DrillSession<S, T> => {
	const [stage] = drill.stages;

	if (stage === undefined) throw new Error("A drill needs at least one stage");

	const game = pausedGame();

	return {
		game: ignore(game),
		state: ignore(drill.start(stage)),
		stage: ignore(stage),
		checkpoint: ignore(game.snapshot()),
		status: "playing",
		mistake: null,
		clears: 0,
		passed: [],
	};
};

const fail = <S, T extends DrillStage>(session: DrillSession<S, T>, mistake: DrillMistake): void => {
	session.game.pause();
	session.status = "mistake";
	session.mistake = ignore(mistake);
};

const deal = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	player: Player,
	round: DrillRound,
): void => {
	const { game, state } = drill.deal(session.state, player, round);

	const isActive = (): boolean => session.status === "playing" && session.game === game;

	game.on("spawn", () => {
		if (isActive()) session.checkpoint = ignore(game.snapshot());
	});
	game.on("place", (event) => {
		if (!isActive()) return;

		const { verdict, next } = drill.judge(session.state, event, player);

		session.state = ignore(next);

		if (!verdict.ok) {
			fail(session, verdict);

			return;
		}

		const { id } = session.stage;

		if (drill.isPassed(next) && !session.passed.includes(id)) session.passed = [...session.passed, id];

		if (drill.isRoundOver(next)) {
			game.pause();
			session.clears++;
			deal(session, drill, player, "next");
		}
	});
	game.on("topout", () => {
		if (isActive()) fail(session, TOP_OUT);
	});

	session.state = ignore(state);
	session.checkpoint = ignore(game.snapshot());
	session.status = "playing";
	session.mistake = null;
	session.game = ignore(game);
};

export const dealDrill = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	player: Player,
): void => deal(session, drill, player, "same");

export const retryMistake = <S, T extends DrillStage>(session: DrillSession<S, T>): void => {
	session.game.restore(session.checkpoint);
	session.status = "playing";
	session.mistake = null;
	session.game.resume();
};

export const continueDrill = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	player: Player,
): void => {
	if (session.stage.onMistake === "pause") {
		deal(session, drill, player, "next");

		return;
	}

	session.state = ignore(drill.start(session.stage));
	dealDrill(session, drill, player);
};

export const retryDrill = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	player: Player,
): void => {
	if (session.stage.onMistake === "restart") continueDrill(session, drill, player);
	else if (session.status === "playing") dealDrill(session, drill, player);
	else retryMistake(session);
};

export const setStage = <S, T extends DrillStage>(
	session: DrillSession<S, T>,
	drill: Drill<S, T>,
	player: Player,
	stage: T,
): void => {
	session.stage = ignore(stage);
	session.state = ignore(drill.start(stage));
	dealDrill(session, drill, player);
};
