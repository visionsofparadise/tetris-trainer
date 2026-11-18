import {
	DEMO_HANDLING,
	Game,
	placementCells,
	simBoardOf,
	type GameSetup,
	type Handling,
	type Move,
	type ScriptStep,
} from "@tetris-trainer/game";
import { targetRound, type FamilyId, type TargetRound } from "./families";
import { goalName, hasSoftDrop, passingMoves } from "./goal";
import { callOf, judgeLanding, playerMoves } from "./judge";
import { nextSeed, seeded } from "./random";
import type { BoardMark } from "../../models/BoardMark";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { Drill, DrillStage, DrillWords, Player } from "../drill/Drill";

export interface TargetStage extends DrillStage {
	readonly families: ReadonlyArray<FamilyId>;
	readonly streak: number;
}

export interface TargetState {
	readonly stage: TargetStage;
	readonly seed: number;
	readonly round: TargetRound;
	readonly streak: number;
}

interface TargetLesson {
	readonly stages: ReadonlyArray<TargetStage>;
	readonly watch: ReadonlyArray<FamilyId>;
}

const WORDS: DrillWords = { next: "Next board", why: "The move" };

const NO_OVERLAYS: ReadonlyArray<BoardOverlay> = [];

const NO_MARKS: ReadonlyArray<BoardMark> = [];

const FIRST_WAIT = 30;

const KEY_WAIT = 14;

const DROP_WAIT = 24;

const SEED_RANGE = 2147483646;

const KEY_WORDS: Readonly<Record<string, string>> = {
	moveLeft: "←",
	moveRight: "→",
	rotateCW: "Turn CW",
	rotateCCW: "Turn CCW",
	rotate180: "Turn 180",
	softDrop: "Soft drop",
	hardDrop: "Hard drop",
};

const familyOf = (stage: TargetStage, seed: number): FamilyId => seeded(seed).pick(stage.families);

const roundOf = (stage: TargetStage, seed: number): TargetRound => targetRound(familyOf(stage, seed), seed);

const startTarget = (stage: TargetStage, seed: number): TargetState => ({
	stage,
	seed,
	round: roundOf(stage, seed),
	streak: 0,
});

const roundSetup = ({ rows, mino }: TargetRound): GameSetup => ({
	board: [{ rows }],
	validate: false,
	queue: { pieces: [mino], mode: "any" },
	holdEnabled: false,
});

export const roundGame = (round: TargetRound, handling: Handling): Game => {
	const game = new Game(handling);

	game.setGravity(0);
	game.load(roundSetup(round));

	return game;
};

export const roundBoard = (round: TargetRound) => simBoardOf(roundGame(round, DEMO_HANDLING).board);

const stepWord = (step: ScriptStep): string => {
	if ("das" in step) return `DAS ${KEY_WORDS[step.das] ?? step.das}`;

	if ("tap" in step)
		return step.tap.startsWith("move") ? `Tap ${KEY_WORDS[step.tap]}` : (KEY_WORDS[step.tap] ?? step.tap);

	if ("hold" in step) return KEY_WORDS[step.hold] ?? step.hold;

	return "";
};

const timedKeys = (keys: ReadonlyArray<ScriptStep>): Array<ScriptStep> =>
	keys.map((step, index) => ({
		...step,
		wait: index === 0 ? FIRST_WAIT : index === keys.length - 1 ? DROP_WAIT : KEY_WAIT,
	}));

export const passingMove = (round: TargetRound, player: Player): Move | null =>
	passingMoves(round.goal, playerMoves(roundBoard(round), round, player))[0] ?? null;

const missingMove = (round: TargetRound, player: Player): Move | null => {
	const moves = playerMoves(roundBoard(round), round, player);
	const passing = passingMoves(round.goal, moves);
	const fails = moves.filter(
		(move) => callOf(round.goal, { ...move, softDropped: hasSoftDrop(move.keys) }, passing) !== null,
	);

	return fails.find((move) => move.lines === 0) ?? fails[0] ?? null;
};

const roundMarks = (round: TargetRound): ReadonlyArray<BoardMark> =>
	round.goal.kind === "spot" ? [{ cells: placementCells(round.target), tone: "target" }] : NO_MARKS;

const describeRound = ({ stage, round, streak }: TargetState, player: Player): string =>
	JSON.stringify({
		stage: stage.id,
		family: round.family,
		seed: round.seed,
		goal: round.goal,
		streak,
		pass: passingMove(round, player)?.keys ?? [],
		miss: missingMove(round, player)?.keys ?? [],
	});

export const targetDrill = ({ stages, watch }: TargetLesson): Drill<TargetState, TargetStage> => ({
	stages,
	words: WORDS,
	start: startTarget,
	deal: (state, player, round) => {
		const seed = nextSeed(state.round.seed);
		const next = round === "next" ? { ...state, seed, round: roundOf(state.stage, seed) } : state;

		return { game: roundGame(next.round, player.handling), state: next };
	},
	judge: (state, { event, before }, { player }) => {
		const mistake = judgeLanding(state.round, event, before.board, player);

		if (mistake === null) return { verdict: { ok: true }, next: { ...state, streak: state.streak + 1 } };

		return { verdict: { ok: false, ...mistake }, next: { ...state, streak: 0 } };
	},
	isRoundOver: () => true,
	isPassed: ({ stage, streak }) => streak >= stage.streak,
	progress: ({ stage, round, streak }) => ({
		label: goalName(round.goal, round.mino),
		value: `${Math.min(streak, stage.streak)} / ${stage.streak} in a row`,
	}),
	marks: ({ round }) => roundMarks(round),
	overlays: () => NO_OVERLAYS,
	describe: describeRound,
	onContinue: "next-round",
	watch: (_player, _search, index) => {
		const family = watch[index % watch.length] ?? "hard-drop";
		const round = targetRound(family, 1 + Math.floor(Math.random() * SEED_RANGE));
		const demo: Player = { handling: DEMO_HANDLING, allow180: false };
		const keys = passingMove(round, demo)?.keys ?? [{ tap: "hardDrop" }];
		const turn = { steps: timedKeys(keys), line: null };

		return {
			game: roundGame(round, DEMO_HANDLING),
			locks: 1,
			marks: roundMarks(round),
			narration: [goalName(round.goal, round.mino), ...keys.map(stepWord)],
			play: () => Promise.resolve(turn),
		};
	},
});
