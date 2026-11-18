import {
	BAG,
	BOARD_COLUMNS,
	cellsKey,
	fitAfter,
	generateMoves,
	homeless,
	lockCells,
	Mino,
	ORIENTATIONS,
	placementCells,
	rowsReady,
	windowFill,
	type FitResult,
	type Move,
	type Mover,
	type MoveRules,
	type Piece,
	type QuadGoal,
	type ScriptStep,
	type SearchResult,
	type SearchState,
	type SimBoard,
} from "@tetris-trainer/game";
import {
	barredPits,
	buriedRows,
	bumpiness,
	columnHeights,
	coveredCells,
	deadRows,
	deepPits,
	stackHeight,
	wellFloor,
} from "./boardFacts";
import { isWellMove } from "./rules";
import type { WellStage } from "./stages";

interface Ranked {
	readonly move: Move;
	readonly key: ReadonlyArray<number>;
}

export interface Choice {
	readonly move: Move;
	readonly hold: boolean;
}

export interface TurnOption {
	readonly piece: Piece;
	readonly hold: boolean;
}

interface Profile {
	readonly bottoms: ReadonlyArray<number>;
	readonly tops: ReadonlyArray<number>;
}

interface Context {
	readonly stage: WellStage;
	readonly rules: MoveRules;
	readonly mover: Mover;
	readonly barred: ReadonlyArray<number>;
	readonly regionPieces: ReadonlyArray<Piece>;
}

interface Node {
	readonly board: SimBoard;
	readonly root: Choice;
	readonly cost: number;
	readonly score: number;
	readonly held: Piece | null;
	readonly skip: number | null;
}

const QUAD_LINES = 4;

const HARD_DROP: ReadonlyArray<ScriptStep> = [{ tap: "hardDrop" }];

const HOLD: ReadonlyArray<ScriptStep> = [{ tap: "hold" }];

const NO_TIES: SearchResult = { kind: "beyond", nodes: 0 };

const WEIGHTS = {
	hole: 300,
	buried: 200,
	deadPit: 300,
	edgePit: 25,
	sidePit: 40,
	shallowPit: 10,
	bump: 10,
	high: 6,
	homeless: 300,
	lonely: 50,
	playerHomeless: 75,
	under: 15,
	region: 80,
	quad: 30,
	stuck: 500,
};

const HIGH_FROM = 12;

const DEAD_PIT = 3;

const SHALLOW_PIT = 2;

const BEAM = 12;

const LOOKAHEAD = 5;

const REGION_CAP = 8;

const REGION_DISCOUNT = 0.9;

const REGION_ROUNDS = 120;

const leftmost = ({ cells }: Move): number => Math.min(...cells.map(([x]) => x));

const compareKeys = (first: ReadonlyArray<number>, second: ReadonlyArray<number>): number => {
	for (const [index, value] of first.entries()) {
		const difference = value - (second[index] ?? 0);

		if (difference !== 0) return difference;
	}

	return 0;
};

const rank = (move: Move, board: SimBoard, covered: number, goal: QuadGoal, rules: MoveRules): Ranked => {
	const lock = lockCells(board, move.cells, move.spin);

	return {
		move,
		key: [
			buriedRows(lock.board, goal.well),
			barredPits(lock.board, goal.well, rules.excluded[Mino.I] ?? []),
			coveredCells(lock.added) - covered,
			move.lines === QUAD_LINES ? 0 : 1,
			deadRows(lock.board, goal.well) - wellFloor(lock.board, goal.well),
			deepPits(lock.board, goal.well),
			move.placement.mino === Mino.I ? 1 : 0,
			homeless(lock.board, BAG, rules).length,
			bumpiness(lock.board, goal.well),
			-windowFill(lock.board, goal),
			stackHeight(lock.board),
			move.presses,
			leftmost(move),
		],
	};
};

export const pickMove = (
	candidates: ReadonlyArray<Move>,
	board: SimBoard,
	goal: QuadGoal,
	rules: MoveRules,
): Move | null => {
	const covered = coveredCells(board);
	const [best] = candidates
		.map((move) => rank(move, board, covered, goal, rules))
		.sort((first, second) => compareKeys(first.key, second.key));

	return best?.move ?? null;
};

export const candidatesFor = (
	board: SimBoard,
	mino: Piece,
	stage: WellStage,
	rules: MoveRules,
	mover: Mover,
): Array<Move> =>
	generateMoves(board, mino, { ...rules, holeFreeOnly: false }, mover).filter(
		({ cells, lines }) => !isWellMove(mino, cells, lines, stage, board),
	);

const tiedMoves = (before: SearchResult, mino: Piece): ReadonlySet<string> | null =>
	before.kind === "reached"
		? new Set(before.firstSteps.flatMap(({ move }) => (move.placement.mino === mino ? [cellsKey(move.cells)] : [])))
		: null;

export const isStrictSubset = (smaller: ReadonlyArray<Piece>, larger: ReadonlyArray<Piece>): boolean =>
	smaller.length < larger.length && smaller.every((piece) => larger.includes(piece));

export const judgedAlternatives = (
	fits: ReadonlyArray<FitResult>,
	before: SearchResult,
	mino: Piece,
	stage: WellStage,
	board: SimBoard,
): Array<FitResult> => {
	const tied = tiedMoves(before, mino);

	return fits.filter(
		({ move }) =>
			!isWellMove(mino, move.cells, move.lines, stage, board) && (tied === null || tied.has(cellsKey(move.cells))),
	);
};

export const passingMoves = (
	fits: ReadonlyArray<FitResult>,
	before: SearchResult,
	mino: Piece,
	stage: WellStage,
	board: SimBoard,
): Array<Move> => {
	const alternatives = judgedAlternatives(fits, before, mino, stage, board);

	return alternatives
		.filter(
			({ move, homeless: left }) =>
				move.lines === QUAD_LINES || !alternatives.some(({ homeless: other }) => isStrictSubset(other, left)),
		)
		.map(({ move }) => move);
};

export const turnOptions = (spawn: SearchState, canHold: boolean, owned: ReadonlyArray<Piece>): Array<TurnOption> => {
	const held = spawn.hold ?? spawn.queue[0];
	const holds =
		canHold &&
		spawn.holdEnabled &&
		!spawn.holdLocked &&
		held !== undefined &&
		held !== spawn.current &&
		!owned.includes(held);

	return [{ piece: spawn.current, hold: false }, ...(holds ? [{ piece: held, hold: true }] : [])];
};

const raiseMoves = (board: SimBoard, mino: Piece, stage: WellStage, rules: MoveRules, mover: Mover): Array<Move> => {
	if (mino === Mino.I || rules.deadRows <= wellFloor(board, stage.well)) return [];

	const open: MoveRules = {
		...rules,
		excluded: { ...rules.excluded, [mino]: (rules.excluded[mino] ?? []).filter((x) => x !== stage.well) },
	};

	return generateMoves(board, mino, open, mover).filter(
		({ cells, lines }) => cells.some(([x]) => x === stage.well) && !isWellMove(mino, cells, lines, stage, board),
	);
};

const profilesOf = (mino: Piece): ReadonlyArray<Profile> => {
	const profiles = new Map<string, Profile>();

	for (const orientation of ORIENTATIONS) {
		const cells = placementCells({ mino, orientation, column: 0, row: 0 });
		const width = Math.max(...cells.map(([x]) => x)) + 1;
		const columns = Array.from({ length: width }, (_, x) => cells.flatMap(([cellX, y]) => (cellX === x ? [y] : [])));
		const profile = { bottoms: columns.map((ys) => Math.min(...ys)), tops: columns.map((ys) => Math.max(...ys) + 1) };

		profiles.set(`${profile.bottoms.join(",")}|${profile.tops.join(",")}`, profile);
	}

	return [...profiles.values()];
};

const PROFILES = new Map(BAG.map((mino) => [mino, profilesOf(mino)]));

interface Landing {
	readonly heights: ReadonlyArray<number>;
	readonly from: number;
	readonly to: number;
}

const landingsOf = (heights: ReadonlyArray<number>, mino: Piece, isOpen: (x: number) => boolean): Array<Landing> => {
	const landings: Array<Landing> = [];

	for (const { bottoms, tops } of PROFILES.get(mino) ?? []) {
		for (let x = 0; x + bottoms.length <= heights.length; x++) {
			let open = true;
			let landing = -Infinity;

			for (const [index, bottom] of bottoms.entries()) {
				open &&= isOpen(x + index);
				landing = Math.max(landing, (heights[x + index] ?? 0) - bottom);
			}

			if (!open || bottoms.some((bottom, index) => heights[x + index] !== landing + bottom)) continue;

			const after = [...heights];

			for (const [index, top] of tops.entries()) after[x + index] = landing + top;

			landings.push({ heights: after, from: x - 1, to: x + bottoms.length });
		}
	}

	return landings;
};

const pitDepth = (heights: ReadonlyArray<number>, x: number, well: number): number => {
	const left = x === 0 || x - 1 === well ? Infinity : (heights[x - 1] ?? Infinity);
	const right = x === heights.length - 1 || x + 1 === well ? Infinity : (heights[x + 1] ?? Infinity);
	const depth = Math.min(left, right) - (heights[x] ?? 0);

	return Number.isFinite(depth) ? Math.max(depth, 0) : 0;
};

const isDeadPit = (heights: ReadonlyArray<number>, x: number, well: number, barred: ReadonlyArray<number>): boolean =>
	barred.includes(x) && pitDepth(heights, x, well) >= DEAD_PIT;

const regionKey = (heights: ReadonlyArray<number>): string => {
	const base = Math.min(...heights);

	return heights.map((height) => Math.min(height - base, REGION_CAP)).join(",");
};

const regionStates = (width: number): Array<Array<number>> =>
	Array.from({ length: width }).reduce<Array<Array<number>>>(
		(states) => states.flatMap((state) => Array.from({ length: REGION_CAP + 1 }, (_, height) => [...state, height])),
		[[]],
	);

const regionTables = new Map<string, ReadonlyMap<string, number>>();

const regionTable = (width: number, pieces: ReadonlyArray<Piece>): ReadonlyMap<string, number> => {
	const id = `${width}:${pieces.join("")}`;
	const known = regionTables.get(id);

	if (known) return known;

	const columns = Array.from({ length: width }, (_, x) => x);
	const isLive = (state: ReadonlyArray<number>): boolean => !columns.some((x) => isDeadPit(state, x, -1, columns));
	const exits = new Map(
		regionStates(width)
			.filter((state) => Math.min(...state) === 0 && isLive(state))
			.map((state) => [
				regionKey(state),
				pieces.map((mino) =>
					landingsOf(state, mino, () => true)
						.filter((landing) => isLive(landing.heights))
						.map((landing) => regionKey(landing.heights)),
				),
			]),
	);
	let values = new Map([...exits.keys()].map((key) => [key, 0]));

	for (let round = 0; round < REGION_ROUNDS; round++) {
		const previous = values;

		values = new Map(
			[...exits].map(([key, options]) => {
				const stay = REGION_DISCOUNT * (previous.get(key) ?? 0);
				const total = options.reduce(
					(sum, afters) =>
						sum + Math.max(stay, ...afters.map((after) => 1 + REGION_DISCOUNT * (previous.get(after) ?? 0))),
					0,
				);

				return [key, total / pieces.length];
			}),
		);
	}

	regionTables.set(id, values);

	return values;
};

const regionCost = (heights: ReadonlyArray<number>, pieces: ReadonlyArray<Piece>): number => {
	const table = regionTable(heights.length, pieces);

	return Math.max(...table.values()) - (table.get(regionKey(heights)) ?? 0);
};

const spotsFor = (heights: ReadonlyArray<number>, mino: Piece, context: Context): number => {
	const { stage, rules, barred } = context;
	const excluded = rules.excluded[mino] ?? [];

	return landingsOf(heights, mino, (x) => !excluded.includes(x)).filter(({ heights: after, from, to }) => {
		for (let x = from; x <= to; x++) if (isDeadPit(after, x, stage.well, barred)) return false;

		return true;
	}).length;
};

const roughness = (heights: ReadonlyArray<number>): number =>
	heights.reduce((sum, height, index) => sum + Math.abs(height - (heights[index - 1] ?? height)), 0);

const meanOf = (heights: ReadonlyArray<number>): number =>
	heights.reduce((sum, height) => sum + height, 0) / heights.length;

const pitCost = (heights: ReadonlyArray<number>, x: number, context: Context): number => {
	const { stage, barred } = context;
	const depth = pitDepth(heights, x, stage.well);
	const isEdge = x - 1 === stage.well || x + 1 === BOARD_COLUMNS;

	if (barred.includes(x))
		return depth >= DEAD_PIT
			? WEIGHTS.deadPit * (depth - SHALLOW_PIT)
			: depth === SHALLOW_PIT && isEdge
				? WEIGHTS.edgePit
				: 0;

	return depth >= DEAD_PIT ? WEIGHTS.sidePit * (depth - SHALLOW_PIT) : depth === SHALLOW_PIT ? WEIGHTS.shallowPit : 0;
};

const homeCost = (heights: ReadonlyArray<number>, context: Context): number =>
	BAG.reduce((sum, mino) => {
		const spots = spotsFor(heights, mino, context);

		if (!context.stage.owned.includes(mino)) return sum + (spots === 0 ? WEIGHTS.playerHomeless : 0);

		return sum + (spots === 0 ? WEIGHTS.homeless : spots === 1 ? WEIGHTS.lonely : 0);
	}, 0);

const boardCost = (board: SimBoard, context: Context): number => {
	const { well } = context.stage;
	const heights = columnHeights(board);
	const columns = heights.map((_, x) => x).filter((x) => x !== well);
	const left = columns.filter((x) => x < well).map((x) => heights[x] ?? 0);
	const right = columns.filter((x) => x > well).map((x) => heights[x] ?? 0);
	const shape = columns.reduce(
		(sum, x) => sum + pitCost(heights, x, context) + WEIGHTS.high * Math.max((heights[x] ?? 0) - HIGH_FROM, 0),
		WEIGHTS.bump * (roughness(left) + roughness(right)),
	);
	const sides =
		right.length === 0 || context.regionPieces.length === 0
			? 0
			: WEIGHTS.under * Math.max(meanOf(left) - meanOf(right), 0) +
				WEIGHTS.region * regionCost(right, context.regionPieces);

	return (
		WEIGHTS.hole * coveredCells(board) +
		WEIGHTS.buried * buriedRows(board, well) +
		shape +
		sides +
		homeCost(heights, context)
	);
};

const nodeMoves = (board: SimBoard, mino: Piece, context: Context): Array<Move> => {
	const { stage, rules, mover } = context;
	const local: MoveRules = { ...rules, deadRows: deadRows(board, stage.well) };
	const clean = [
		...generateMoves(board, mino, local, mover).filter(
			({ cells, lines }) => !isWellMove(mino, cells, lines, stage, board),
		),
		...raiseMoves(board, mino, stage, local, mover),
	];

	return clean.length > 0 ? clean : candidatesFor(board, mino, stage, local, mover);
};

const childOf = (parent: Node, move: Move, context: Context): Node => {
	const lock = lockCells(parent.board, move.cells, move.spin);
	const holes = Math.max(coveredCells(lock.added) - coveredCells(parent.board), 0);
	const cost = parent.cost + WEIGHTS.hole * holes - (lock.lines === QUAD_LINES ? WEIGHTS.quad : 0);

	return { ...parent, board: lock.board, cost, score: cost + boardCost(lock.board, context) };
};

const bestChild = (node: Node, mino: Piece, context: Context): Node => {
	const [best] = nodeMoves(node.board, mino, context)
		.map((move) => childOf(node, move, context))
		.sort((first, second) => first.score - second.score);

	return best ?? node;
};

const quadBoard = (board: SimBoard, well: number): SimBoard | null => {
	if (rowsReady(board, { well }) < QUAD_LINES) return null;

	const floor = wellFloor(board, well);
	const rows = new Uint16Array(board.rows.length);

	rows.set(board.rows.subarray(0, floor));
	rows.set(board.rows.subarray(floor + QUAD_LINES), floor);

	return { rows };
};

const playerStep = (node: Node, mino: Piece, index: number, upcoming: Piece | undefined, context: Context): Node => {
	const reach =
		mino === Mino.I
			? "current"
			: node.held === Mino.I
				? "held"
				: node.held === null && upcoming === Mino.I
					? "next"
					: null;
	const quad = reach === null ? null : quadBoard(node.board, context.stage.well);

	if (quad === null) return bestChild(node, mino, context);

	const cost = node.cost - WEIGHTS.quad;

	return {
		...node,
		board: quad,
		cost,
		score: cost + boardCost(quad, context),
		held: reach === "current" ? node.held : mino,
		skip: reach === "next" ? index + 1 : null,
	};
};

const keepBest = (nodes: ReadonlyArray<Node>): Array<Node> => {
	const seen = new Set<string>();

	return [...nodes]
		.sort((first, second) => first.score - second.score)
		.filter(({ board, held }) => {
			const key = `${String.fromCharCode(...board.rows)}${held ?? ""}`;

			if (seen.has(key)) return false;

			seen.add(key);

			return true;
		})
		.slice(0, BEAM);
};

const stepNodes = (
	nodes: ReadonlyArray<Node>,
	mino: Piece,
	index: number,
	upcoming: Piece | undefined,
	context: Context,
): Array<Node> =>
	keepBest(
		nodes.flatMap((node) => {
			if (node.skip === index) return [node];

			if (!context.stage.owned.includes(mino)) return [playerStep(node, mino, index, upcoming, context)];

			const moves = nodeMoves(node.board, mino, context);

			if (moves.length === 0) {
				const cost = node.cost + WEIGHTS.stuck;

				return [{ ...node, cost, score: cost + boardCost(node.board, context) }];
			}

			return moves.map((move) => childOf(node, move, context));
		}),
	);

const planChoice = (
	roots: ReadonlyArray<Choice>,
	spawn: SearchState,
	stage: WellStage,
	rules: MoveRules,
	mover: Mover,
): Choice | null => {
	const context: Context = {
		stage,
		rules,
		mover,
		barred: rules.excluded[Mino.I] ?? [],
		regionPieces: BAG.filter((mino) => !(rules.excluded[mino] ?? []).some((x) => x > stage.well)),
	};
	const sequence = spawn.queue.slice(0, LOOKAHEAD);
	const start = (root: Choice): Node => ({
		board: spawn.board,
		root,
		cost: 0,
		score: 0,
		held: root.hold ? spawn.current : spawn.hold,
		skip: root.hold && spawn.hold === null ? 0 : null,
	});
	const leaves = sequence.reduce(
		(nodes, mino, index) => stepNodes(nodes, mino, index, sequence[index + 1], context),
		keepBest(roots.map((root) => childOf(start(root), root.move, context))),
	);

	return leaves[0]?.root ?? null;
};

const appRoots = (
	spawn: SearchState,
	options: ReadonlyArray<TurnOption>,
	stage: WellStage,
	rules: MoveRules,
	mover: Mover,
): Array<Choice> =>
	options.flatMap(({ piece, hold }) =>
		[
			...generateMoves(spawn.board, piece, rules, mover).filter(
				({ cells, lines }) => !isWellMove(piece, cells, lines, stage, spawn.board),
			),
			...raiseMoves(spawn.board, piece, stage, rules, mover),
		].map((move) => ({ move, hold })),
	);

const playerRoots = (
	spawn: SearchState,
	before: SearchResult,
	options: ReadonlyArray<TurnOption>,
	stage: WellStage,
	rules: MoveRules,
	mover: Mover,
): Array<Choice> => {
	const { board } = spawn;
	const fits = options.map(({ piece, hold }) => ({
		piece,
		hold,
		fits: [
			...fitAfter(board, piece, BAG, rules, mover),
			...raiseMoves(board, piece, stage, rules, mover).map((move) => ({
				move,
				homeless: homeless(lockCells(board, move.cells, move.spin).board, BAG, rules),
			})),
		],
	}));

	for (const result of [before, NO_TIES]) {
		const passing = fits.flatMap(({ piece, hold, fits: found }) =>
			passingMoves(found, result, piece, stage, board).map((move) => ({ move, hold })),
		);

		if (passing.length > 0) return passing;
	}

	return [];
};

export const chooseMove = (
	spawn: SearchState,
	before: SearchResult,
	stage: WellStage,
	rules: MoveRules,
	mover: Mover,
	canHold: boolean,
): Choice | null => {
	const options = turnOptions(spawn, canHold, stage.owned);
	const roots = stage.owned.includes(spawn.current)
		? appRoots(spawn, options, stage, rules, mover)
		: playerRoots(spawn, before, options, stage, rules, mover);
	const fallback = (): Array<Choice> =>
		options.flatMap(({ piece, hold }) =>
			candidatesFor(spawn.board, piece, stage, rules, mover).map((move) => ({ move, hold })),
		);

	return planChoice(roots.length > 0 ? roots : fallback(), spawn, stage, rules, mover);
};

export const choiceKeys = (choice: Choice | null): ReadonlyArray<ScriptStep> =>
	choice === null ? HARD_DROP : [...(choice.hold ? HOLD : []), ...choice.move.keys];
