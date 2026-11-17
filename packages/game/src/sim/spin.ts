import { Mino, type SpinType } from "@haelp/teto/engine";
import { fits, pieceShapes } from "./shapes";
import { isFilled, type SimBoard } from "./simBoard";
import type { Block, Piece } from "../pieces";

interface Corner {
	readonly x: number;
	readonly y: number;
	readonly fronts: ReadonlyArray<number>;
}

const T_CORNERS: ReadonlyArray<Corner> = [
	{ x: 0, y: 0, fronts: [3, 0] },
	{ x: 2, y: 0, fronts: [0, 1] },
	{ x: 2, y: -2, fronts: [1, 2] },
	{ x: 0, y: -2, fronts: [2, 3] },
];

const TST_KICKS: ReadonlyArray<{ readonly ids: ReadonlyArray<string>; readonly kick: Block }> = [
	{ ids: ["23", "03"], kick: [1, -2] },
	{ ids: ["21", "01"], kick: [-1, -2] },
];

export const isTstKick = (from: number, to: number, kick: Block): boolean =>
	TST_KICKS.some(
		({ ids, kick: [kickX, kickY] }) => ids.includes(`${from}${to}`) && kick[0] === kickX && kick[1] === kickY,
	);

const cornerSpin = (board: SimBoard, rotation: number, x: number, y: number, tstKick: boolean): SpinType => {
	let corners = 0;
	let fronts = 0;

	for (const corner of T_CORNERS)
		if (isFilled(board, x + corner.x, y + corner.y)) {
			corners++;

			if (corner.fronts.includes(rotation)) fronts++;
		}

	if (corners < 3) return "none";

	return tstKick || fronts === 2 ? "normal" : "mini";
};

export const rotationSpin = (
	board: SimBoard,
	mino: Piece,
	rotation: number,
	x: number,
	y: number,
	tstKick: boolean,
): SpinType => {
	const shape = pieceShapes(mino)[rotation];

	if (!shape || fits(board, shape, x, y - 1)) return "none";

	const tSpin = mino === Mino.T ? cornerSpin(board, rotation, x, y, tstKick) : "none";
	const isImmobile = !fits(board, shape, x - 1, y) && !fits(board, shape, x + 1, y) && !fits(board, shape, x, y + 1);

	return isImmobile && tSpin === "none" ? "mini" : tSpin;
};
