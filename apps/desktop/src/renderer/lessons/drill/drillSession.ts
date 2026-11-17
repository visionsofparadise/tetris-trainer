import { DEFAULT_CONFIG, Game, type GameSnapshot } from "@tetris-trainer/game";
import { ignore } from "opshot";
import type { Drill, DrillMistake, DrillStage, Player } from "./Drill";

type DrillStatus = "playing" | "mistake";

export interface DrillSession<S> {
	game: Game;
	state: S;
	stage: DrillStage;
	checkpoint: GameSnapshot;
	status: DrillStatus;
	mistake: DrillMistake | null;
	clears: number;
	passed: ReadonlyArray<string>;
}

const TOP_OUT: DrillMistake = { kind: "top-out", title: "Top out", placed: null, best: null };

export const createDrillSession = <S>(drill: Drill<S>): DrillSession<S> => {
	const [stage] = drill.stages;

	if (stage === undefined) throw new Error("A drill needs at least one stage");

	const game = new Game(DEFAULT_CONFIG.handling);

	game.pause();

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

const fail = <S>(session: DrillSession<S>, mistake: DrillMistake): void => {
	session.game.pause();
	session.status = "mistake";
	session.mistake = ignore(mistake);
};

export const dealDrill = <S>(session: DrillSession<S>, drill: Drill<S>, player: Player): void => {
	const { game, state } = drill.deal(session.state, player);

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
			dealDrill(session, drill, player);
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

export const retryMistake = <S>(session: DrillSession<S>): void => {
	session.game.restore(session.checkpoint);
	session.status = "playing";
	session.mistake = null;
	session.game.resume();
};

export const redealRound = <S>(session: DrillSession<S>, drill: Drill<S>, player: Player): void =>
	dealDrill(session, drill, player);

export const continueDrill = <S>(session: DrillSession<S>, drill: Drill<S>, player: Player): void => {
	if (session.stage.onMistake === "restart") session.state = ignore(drill.start(session.stage));

	dealDrill(session, drill, player);
};

export const setStage = <S>(session: DrillSession<S>, drill: Drill<S>, player: Player, stage: DrillStage): void => {
	session.stage = ignore(stage);
	session.state = ignore(drill.start(stage));
	dealDrill(session, drill, player);
};
