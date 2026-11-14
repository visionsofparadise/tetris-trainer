import { BAG, type Piece } from "./pieces";
import { SetupError } from "./SetupError";

export interface DrawnPiece {
	readonly mino: Piece;
	readonly label: string;
}

export const bagRemainder = (drawn: ReadonlyArray<DrawnPiece>): Array<Piece> => {
	let bag = new Set<Piece>();

	for (const { mino, label } of drawn) {
		if (bag.has(mino))
			throw new SetupError(`${label} (${mino.toUpperCase()}) repeats a piece already drawn from its 7-bag`);

		bag.add(mino);

		if (bag.size === BAG.length) bag = new Set();
	}

	return BAG.filter((mino) => !bag.has(mino));
};
