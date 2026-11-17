import { RNG } from "@haelp/teto/engine";
import { DEMO_HANDLING } from "../config";
import { BAG, type Piece, type Placement } from "../pieces";
import { emptySimBoard, lockCells } from "../sim/simBoard";
import { generateMoves, type Mover, type MoveRules } from "./moves";

const STACK_MOVER: Mover = { handling: DEMO_HANDLING, gravity: 0 };

const stackRules = (heightCap: number, well: number | null): MoveRules => ({
	allow180: true,
	excluded: well === null ? {} : Object.fromEntries(BAG.map((mino) => [mino, [well]])),
	holeFreeOnly: true,
	ceiling: heightCap,
	quadClearsOnly: false,
});

export const cleanStack = (seed: number, deals: number, heightCap: number, well: number | null): Array<Placement> => {
	const rng = new RNG(seed);
	const rules = stackRules(heightCap, well);
	const placements: Array<Placement> = [];
	let board = emptySimBoard();
	let bag: Array<Piece> = [];

	for (let deal = 0; deal < deals; deal++) {
		if (bag.length === 0) bag = rng.shuffleArray([...BAG]);

		const mino = bag.shift();

		if (mino === undefined) break;

		const moves = generateMoves(board, mino, rules, STACK_MOVER);
		const move = moves[Math.floor(rng.nextFloat() * moves.length)];

		if (move === undefined) continue;

		placements.push(move.placement);
		board = lockCells(board, move.cells, move.spin).board;
	}

	return placements;
};
