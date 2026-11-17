import { Engine, legal } from "@haelp/teto/engine";
import { describe, expect, it } from "vitest";
import { DEMO_HANDLING } from "../config";
import { createEngineOptions } from "../engineOptions";
import { finesseTargets, minimalPresses } from "../finesse";
import { BAG, cellsKey, placementCells, samePlacement, type Piece } from "../pieces";
import { emptySimBoard, FULL_ROW, lockCells, type SimBoard } from "../sim/simBoard";
import { generateMoves, type Mover } from "./moves";
import {
	chunks,
	HOLE_BOARDS,
	loadBoard,
	MOVERS,
	OPEN_RULES,
	playMove,
	SPIN_BOARDS,
	STACK_BOARDS,
	ZERO_GRAVITY,
	type NamedBoard,
} from "./plays";
import type { Game } from "../Game";

const CHUNKS: ReadonlyArray<readonly [string, ReadonlyArray<NamedBoard>]> = [
	...chunks(STACK_BOARDS, 25).map((boards): readonly [string, ReadonlyArray<NamedBoard>] => [
		`${boards[0]?.name ?? ""} to ${boards.at(-1)?.name ?? ""}`,
		boards,
	]),
	["holes 1 to 25", HOLE_BOARDS],
	["authored spin boards", SPIN_BOARDS],
];

interface Position {
	readonly x: number;
	readonly y: number;
	readonly rotation: number;
}

const ACTIONS: ReadonlyArray<(engine: Engine) => unknown> = [
	(engine) => engine.moveLeft(),
	(engine) => engine.moveRight(),
	(engine) => engine.dasLeft(),
	(engine) => engine.dasRight(),
	(engine) => engine.rotateCW(),
	(engine) => engine.rotateCCW(),
	(engine) => engine.rotate180(),
	(engine) => engine.softDrop(),
];

const place = (engine: Engine, { x, y, rotation }: Position): void => {
	engine.falling.location = [x, y];
	engine.falling.rotation = rotation;
	engine.falling.totalRotations = 0;
};

const engineLocks = (game: Game): Set<string> => {
	const engine = new Engine(createEngineOptions(DEMO_HANDLING, 1));

	engine.fromSnapshot(game.snapshot().engine);

	const [startX = 0, startY = 0] = engine.falling.location;
	const start: Position = { x: startX, y: startY, rotation: engine.falling.rotation };
	const positions = new Map([[`${start.x},${start.y},${start.rotation}`, start]]);
	const queue = [start];

	for (let position = queue.shift(); position; position = queue.shift())
		for (const action of ACTIONS) {
			place(engine, position);
			action(engine);

			const [x = 0, y = 0] = engine.falling.location;
			const reached: Position = { x, y, rotation: engine.falling.rotation };
			const key = `${x},${y},${reached.rotation}`;

			if (!positions.has(key)) {
				positions.set(key, reached);
				queue.push(reached);
			}
		}

	return new Set(
		[...positions.values()].map((position) => {
			place(engine, position);

			let row = Math.floor(position.y);

			while (legal(engine.falling.absoluteAt({ y: row - 1 }), engine.board.state)) row--;

			return cellsKey(engine.falling.absoluteAt({ y: row }));
		}),
	);
};

const mismatches = (board: SimBoard, mino: Piece, mover: Mover): Array<string> => {
	const { game, start } = loadBoard(board, mino, mover);
	const fullBefore = board.rows.filter((row) => row === FULL_ROW).length;

	return generateMoves(board, mino, OPEN_RULES, mover).flatMap((move) => {
		const { placed, board: played } = playMove(game, start, move);
		const locked = lockCells(board, move.cells, move.spin);
		const isMatch =
			placed !== null &&
			samePlacement(placed.placement, move.placement) &&
			placed.spin === move.spin &&
			placed.lines === move.lines + fullBefore &&
			locked.lines === placed.lines &&
			played.rows.every((row, y) => row === locked.board.rows[y]);

		return isMatch
			? []
			: [
					`${JSON.stringify(move.placement)} ${move.spin} ${move.lines} by ${JSON.stringify(move.keys)} placed ${JSON.stringify(placed?.placement)} ${placed?.spin ?? ""} ${placed?.lines ?? ""}`,
				];
	});
};

describe("generateMoves on an empty board", () => {
	it.each([true, false])("costs each finesse target its minimal presses with allow180 %s", (allow180) => {
		const presses = new Map(
			BAG.flatMap((mino) =>
				generateMoves(emptySimBoard(), mino, { ...OPEN_RULES, allow180 }, ZERO_GRAVITY).map((move) => [
					`${mino} ${cellsKey(move.cells)}`,
					move.presses,
				]),
			),
		);

		for (const target of finesseTargets())
			expect(
				presses.get(`${target.mino} ${cellsKey(placementCells({ ...target, row: 0 }))}`),
				JSON.stringify(target),
			).toBe(minimalPresses(target, { allow180 }));
	});
});

describe("generateMoves against the game", () => {
	describe.each(BAG)("%s", (mino) => {
		describe.each(MOVERS)("with %s", (_, mover) => {
			it.each(CHUNKS)("plays every move on %s as generated, leaving the board lockCells gives", (_, boards) => {
				const wrong = boards.flatMap(({ name, board }) =>
					mismatches(board, mino, mover).map((miss) => `${name}: ${miss}`),
				);

				expect(wrong).toEqual([]);
			});
		});

		it.each(CHUNKS)("finds every lock the engine reaches at 0G on %s", (_, boards) => {
			const missing = boards.flatMap(({ name, board }) => {
				const reached = engineLocks(loadBoard(board, mino, ZERO_GRAVITY).game);
				const generated = new Set(
					generateMoves(board, mino, OPEN_RULES, ZERO_GRAVITY).map((move) => cellsKey(move.cells)),
				);

				return [...reached].filter((cells) => !generated.has(cells)).map((cells) => `${name}: ${cells}`);
			});

			expect(missing).toEqual([]);
		});
	});
});
