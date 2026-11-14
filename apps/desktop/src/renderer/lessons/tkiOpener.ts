import { finesseSteps, Mino } from "@tetris-trainer/game";
import type { SequenceLesson } from "./sequenceLesson";

export const TKI_OPENER: SequenceLesson = {
	name: "TKI opener",
	instructions:
		"Build a TKI from the first bag, then spin the T into its slot for a T-spin double. Hold is off. Every piece must land where the demonstration puts it.",
	steps: [
		{ placement: { mino: Mino.L, orientation: "right", column: 0, row: 0 } },
		{ placement: { mino: Mino.I, orientation: "spawn", column: 3, row: 0 } },
		{ placement: { mino: Mino.J, orientation: "reverse", column: 5, row: 0 } },
		{ placement: { mino: Mino.O, orientation: "spawn", column: 8, row: 0 } },
		{ placement: { mino: Mino.Z, orientation: "right", column: 4, row: 1 } },
		{ placement: { mino: Mino.S, orientation: "right", column: 0, row: 2 } },
		{
			placement: { mino: Mino.T, orientation: "reverse", column: 1, row: 0 },
			keys: [
				...finesseSteps({ mino: Mino.T, orientation: "right", column: 2 }),
				{ hold: "softDrop", frames: 20 },
				{ tap: "rotateCW" },
				{ tap: "hardDrop" },
			],
		},
	],
};
