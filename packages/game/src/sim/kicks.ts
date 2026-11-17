import { kickData, Mino } from "@haelp/teto/engine";
import type { Block, Piece } from "../pieces";

type KickSet = Readonly<Record<string, ReadonlyArray<ReadonlyArray<number>>>>;

const SRS_PLUS = kickData["SRS+"];

const upward = (kickSet: KickSet): ReadonlyMap<string, ReadonlyArray<Block>> =>
	new Map(Object.entries(kickSet).map(([id, tests]) => [id, tests.map(([x = 0, y = 0]): Block => [x, 0 - y])]));

const PIECE_KICKS = upward(SRS_PLUS.kicks);

const I_KICKS = upward(SRS_PLUS.i_kicks);

export const kickTests = (mino: Piece, from: number, to: number): ReadonlyArray<Block> =>
	(mino === Mino.I ? I_KICKS : PIECE_KICKS).get(`${from}${to}`) ?? [];
