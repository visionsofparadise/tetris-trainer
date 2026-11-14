import { Mino } from "@tetris-trainer/game";
import type { SequenceLesson } from "./sequenceLesson";

export const TKI_OPENER: SequenceLesson = {
	name: "TKI opener",
	instructions:
		"Build a TKI from the first bag, then spin the T into its slot for a T-spin double. Hold is off. Every piece must land where the demonstration puts it.",
	steps: [
		{
			placement: { mino: Mino.L, rotation: 1, x: -1, y: 2 },
			keys: ["rotateCW", "moveLeft", "moveLeft", "moveLeft", "moveLeft", "hardDrop"],
		},
		{ placement: { mino: Mino.I, rotation: 0, x: 3, y: 1 }, keys: ["hardDrop"] },
		{
			placement: { mino: Mino.J, rotation: 2, x: 5, y: 2 },
			keys: ["rotate180", "moveRight", "moveRight", "hardDrop"],
		},
		{
			placement: { mino: Mino.O, rotation: 0, x: 8, y: 1 },
			keys: ["moveRight", "moveRight", "moveRight", "moveRight", "hardDrop"],
		},
		{ placement: { mino: Mino.Z, rotation: 1, x: 3, y: 3 }, keys: ["rotateCW", "hardDrop"] },
		{
			placement: { mino: Mino.S, rotation: 1, x: -1, y: 4 },
			keys: ["rotateCCW", "moveLeft", "moveLeft", "moveLeft", "hardDrop"],
		},
		{
			placement: { mino: Mino.T, rotation: 2, x: 1, y: 2 },
			keys: ["rotateCW", "moveLeft", "moveLeft", "softDrop", "rotateCW", "hardDrop"],
		},
	],
};
