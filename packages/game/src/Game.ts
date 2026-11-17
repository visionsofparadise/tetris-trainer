import { Board, Engine, legal, type EngineSnapshot, type LockRes, type Mino } from "@haelp/teto/engine";
import mitt from "mitt";
import { BOARD_SIZE, createEngineOptions, DEFAULT_GRAVITY, settleSpawn } from "./engineOptions";
import { KeyRecord } from "./inputs";
import { isPiece, leftmost, lowest, ORIENTATIONS, placementCells, type Block, type Placement } from "./pieces";
import { compileScript, type GameKey, type InputType, type ScriptStep, type ShiftKey } from "./script";
import {
	buildBoard,
	cellsSettle,
	insertGarbage,
	playBoard,
	queueRemainder,
	removeGarbage,
	type Garbage,
	type GameSetup,
} from "./setup";
import { boardTile, type BoardTile } from "./tiles";
import type { Handling } from "./config";
import type { GameEvents, InputEvent, PlaceEvent, SpawnEvent } from "./events";

export interface GameStats {
	pieces: number;
	lines: number;
	attack: number;
	frames: number;
}

export interface GameSnapshot {
	readonly engine: EngineSnapshot;
	readonly isOver: boolean;
}

interface ScheduledInput extends InputEvent {
	readonly frame: number;
}

type LockedPiece = Pick<PlaceEvent, "placement" | "cells" | "inputs">;

export const NEXT_COUNT = 5;

const FRAME_MS = 1000 / 60;

const randomSeed = (): number => Math.floor(Math.random() * 2 ** 31);

export class Game {
	readonly #engine: Engine;
	readonly #handling: Handling;
	readonly #events = mitt<GameEvents>();
	readonly #userKeys = new Set<GameKey>();
	readonly #keys = new KeyRecord();
	readonly #idleInput: Engine["input"];
	#scheduled: Array<ScheduledInput> = [];
	#isOver = false;
	#isPaused = false;
	#isLoading = false;
	#userInput = true;
	#speed = 1;
	#gravity = DEFAULT_GRAVITY;
	#unplayedMs = 0;
	#locked: LockedPiece | null = null;
	#tickRows: Board["state"] = [];
	#spawnAfterLock: SpawnEvent | null = null;

	constructor(handling: Handling, seed = randomSeed()) {
		this.#handling = handling;
		this.#engine = new Engine(createEngineOptions(handling, seed));
		this.#idleInput = structuredClone(this.#engine.input);
		this.#engine.events.on("falling.lock.pre", () => this.#handleLockStart());
		this.#engine.events.on("falling.new", ({ piece, isHold }) => {
			settleSpawn(this.#engine);
			this.#handleSpawn(piece, isHold);
		});
		this.#engine.events.on("falling.lock", (lock) => this.#handleLock(lock));
		settleSpawn(this.#engine);
	}

	get isOver(): boolean {
		return this.#isOver;
	}

	get isPaused(): boolean {
		return this.#isPaused;
	}

	get board(): ReadonlyArray<ReadonlyArray<Mino | null>> {
		return this.#engine.board.state.map((row) => row.map((tile) => tile?.mino ?? null));
	}

	get tiles(): ReadonlyArray<ReadonlyArray<BoardTile | null>> {
		return this.#engine.board.state.map((row) => row.map(boardTile));
	}

	get falling(): { mino: Mino; blocks: Array<Block> } {
		const { falling } = this.#engine;

		return { mino: falling.symbol, blocks: falling.absoluteBlocks };
	}

	get ghost(): Array<Block> {
		const { falling, board } = this.#engine;
		let y = falling.y;

		while (legal(falling.absoluteAt({ y: y - 1 }), board.state)) y--;

		return falling.absoluteAt({ y });
	}

	get isHoldEnabled(): boolean {
		return this.#engine.misc.allowed.hold;
	}

	get hold(): Mino | null {
		return this.#engine.held;
	}

	get next(): Array<Mino> {
		return this.#engine.queue.raw().slice(0, NEXT_COUNT);
	}

	get stats(): GameStats {
		const { stats, frame } = this.#engine;

		return { pieces: stats.pieces, lines: stats.lines, attack: stats.garbage.attack, frames: frame };
	}

	on<K extends keyof GameEvents>(event: K, handler: (data: GameEvents[K]) => void): () => void {
		this.#events.on(event, handler);

		return () => this.#events.off(event, handler);
	}

	load(setup: GameSetup): void {
		const board = new Board(BOARD_SIZE);

		buildBoard(board, setup);

		const play = playBoard(setup);
		const remainder = queueRemainder(setup, play);
		const engine = this.#engine;

		this.#isLoading = true;
		engine.initializer.queue.seed = setup.seed ?? randomSeed();
		engine.reset();
		engine.board.state = board.state;
		engine.held = play.hold;
		engine.misc.allowed.hold = setup.holdEnabled;
		engine.queue.fromSnapshot({
			value: [
				...(play.falling === null ? [] : [play.falling]),
				...setup.queue.pieces,
				...engine.queue.bag.rng.shuffleArray(remainder),
			],
			bag: engine.queue.bag.snapshot(),
		});
		this.#clearSession(false);
		this.#isLoading = false;
		engine.nextPiece();
		engine.holdLocked = play.holdLocked;

		if (!legal(engine.falling.absoluteBlocks, engine.board.state)) this.#topOut();
	}

	settles(placement: Placement): boolean {
		return cellsSettle(placementCells(placement), this.#engine.board.state);
	}

	snapshot(): GameSnapshot {
		return { engine: this.#engine.snapshot(), isOver: this.#isOver };
	}

	restore(snapshot: GameSnapshot): void {
		this.#engine.fromSnapshot(snapshot.engine);
		this.#engine.input = structuredClone(this.#idleInput);
		this.#clearSession(snapshot.isOver);
	}

	advance(realMs: number): void {
		if (this.#isPaused) return;

		this.#unplayedMs += realMs * this.#speed;

		while (this.#unplayedMs >= FRAME_MS) {
			this.#unplayedMs -= FRAME_MS;
			this.#tick();
		}
	}

	step(frames = 1): void {
		for (let count = 0; count < frames; count++) this.#tick();
	}

	pause(): void {
		this.#isPaused = true;
	}

	resume(): void {
		this.#isPaused = false;
	}

	setSpeed(multiplier: number): void {
		this.#speed = multiplier;
	}

	setGravity(gravity: number): void {
		this.#gravity = gravity;
		this.#engine.dynamic.gravity.set(gravity);
	}

	setUserInput(enabled: boolean): void {
		this.#userInput = enabled;

		if (!enabled) for (const key of this.#userKeys) this.release(key);
	}

	press(key: GameKey): void {
		if (!this.#userInput || this.#isPaused || this.#userKeys.has(key)) return;

		this.#userKeys.add(key);
		this.#schedule(0, "keydown", key, "user");
	}

	release(key: GameKey): void {
		if (!this.#userKeys.delete(key)) return;

		this.#schedule(0, "keyup", key, "user");
	}

	input(steps: ReadonlyArray<ScriptStep>): void {
		for (const { frame, type, key } of compileScript(steps, this.#handling))
			this.#schedule(frame, type, key, "script");
	}

	addGarbage(garbage: Garbage): void {
		const { board, falling } = this.#engine;

		insertGarbage(board, garbage);

		while (!legal(falling.absoluteBlocks, board.state) && falling.y < board.fullHeight) falling.location[1] += 1;

		if (!legal(falling.absoluteBlocks, board.state)) this.#topOut();
	}

	removeGarbage(amount: number): number {
		return removeGarbage(this.#engine.board, amount);
	}

	#schedule(offset: number, type: InputType, key: GameKey, source: InputEvent["source"]): void {
		this.#scheduled.push({ frame: this.#engine.frame + offset, type, key, source });
	}

	#tick(): void {
		if (this.#isOver) return;

		const frame = this.#engine.frame;

		this.#tickRows = [...this.#engine.board.state];

		const due = this.#scheduled.filter((input) => input.frame <= frame);

		this.#scheduled = this.#scheduled.filter((input) => input.frame > frame);
		this.#keys.markBlocked((key) => this.#isBlocked(key));

		for (const { type, key, source } of due) {
			this.#keys.add({ frame, type, key, source, blocked: false, carried: false });
			this.#events.emit("input", { type, key, source });
		}

		this.#engine.tick(due.map(({ type, key }) => ({ type, frame, data: { key, subframe: 0 } })));
	}

	#clearSession(isOver: boolean): void {
		this.#isOver = isOver;
		this.#scheduled = [];
		this.#userKeys.clear();
		this.#unplayedMs = 0;
		this.#locked = null;
		this.#spawnAfterLock = null;
		this.#keys.reset(this.#engine.frame);
		this.#engine.dynamic.gravity.set(this.#gravity);
	}

	#isBlocked(key: ShiftKey): boolean {
		const { falling } = this.#engine;
		const own = falling.absoluteBlocks;
		const shifted = falling.absoluteAt({ x: falling.x + (key === "moveLeft" ? -1 : 1) });

		return !legal(
			shifted.filter(([x, y]) => !own.some(([ownX, ownY]) => ownX === x && ownY === y)),
			this.#tickRows,
		);
	}

	#isCharged(key: ShiftKey): boolean {
		const { input } = this.#engine;
		const shift = key === "moveLeft" ? input.lShift : input.rShift;

		return shift.held && input.lastShift === shift.dir && shift.das >= this.#handling.das - this.#handling.dcd;
	}

	#topOut(): void {
		this.#isOver = true;
		this.#events.emit("topout", undefined);
	}

	#handleLockStart(): void {
		const { falling, frame } = this.#engine;
		const mino = falling.symbol;
		const cells = falling.absoluteBlocks;
		const inputs = this.#keys.take(frame, (key) => this.#isBlocked(key));

		this.#tickRows = [...this.#engine.board.state];

		if (!isPiece(mino)) return;

		this.#locked = {
			placement: {
				mino,
				orientation: ORIENTATIONS[falling.rotation % ORIENTATIONS.length] ?? "spawn",
				column: leftmost(cells),
				row: lowest(cells),
			},
			cells,
			inputs,
		};
	}

	#handleSpawn(mino: Mino, fromHold: boolean): void {
		if (this.#isLoading) return;

		if (!fromHold) this.#keys.start(this.#engine.frame, (key) => this.#isCharged(key));

		const held = this.#engine.held;

		if (fromHold && held !== null) this.#events.emit("hold", { mino: held });

		if (this.#locked === null) this.#events.emit("spawn", { mino, fromHold });
		else this.#spawnAfterLock = { mino, fromHold };
	}

	#handleLock(lock: LockRes): void {
		const locked = this.#locked;
		const spawn = this.#spawnAfterLock;

		this.#locked = null;
		this.#spawnAfterLock = null;

		if (locked !== null) {
			const { lines, spin, stats, rawGarbage } = lock;

			this.#events.emit("place", {
				...locked,
				lines,
				spin,
				combo: stats.combo,
				b2b: stats.b2b,
				attack: rawGarbage.reduce((total, amount) => total + amount, 0),
				isPerfectClear: lines > 0 && this.#engine.board.perfectClear,
			});
		}

		if (lock.topout) this.#topOut();
		else if (spawn !== null) this.#events.emit("spawn", spawn);
	}
}
