import { Mino, type Piece } from "@tetris-trainer/game";
import type { DrillStage } from "../drill/Drill";

export type WellStageId = "nine-zero" | "three-side" | "six-side" | "six-three" | "convert" | "eternal";

type WellLayout = "9-0" | "6-3";

type WellStart = "empty" | "convert" | "eternal";

export interface WellStage extends DrillStage {
	readonly id: WellStageId;
	readonly well: number;
	readonly layout: WellLayout;
	readonly owned: ReadonlyArray<Piece>;
	readonly start: WellStart;
	readonly lines: number | null;
	readonly ceiling: number | null;
}

export const NINE_ZERO_WELL = 9;

export const SIX_THREE_WELL = 6;

const STAGE_LINES = 40;

const CEILING = 15;

export const WELL_STAGES: ReadonlyArray<WellStage> = [
	{
		id: "nine-zero",
		title: "9-0",
		goal: "Keep the well in the right column and clear 40 lines by quads. A mistake restarts the run.",
		onMistake: "restart",
		well: NINE_ZERO_WELL,
		layout: "9-0",
		owned: [],
		start: "empty",
		lines: STAGE_LINES,
		ceiling: null,
	},
	{
		id: "three-side",
		title: "Three",
		goal: "The app plays every T and I. Stack the rest around the well and clear 40 lines.",
		onMistake: "pause",
		well: SIX_THREE_WELL,
		layout: "6-3",
		owned: [Mino.T, Mino.I],
		start: "empty",
		lines: STAGE_LINES,
		ceiling: null,
	},
	{
		id: "six-side",
		title: "Six",
		goal: "The app plays J, L, S, Z and O, on the three-side when it fits. Place every T and I and clear 40 lines.",
		onMistake: "pause",
		well: SIX_THREE_WELL,
		layout: "6-3",
		owned: [Mino.J, Mino.L, Mino.S, Mino.Z, Mino.O],
		start: "empty",
		lines: STAGE_LINES,
		ceiling: null,
	},
	{
		id: "six-three",
		title: "6-3",
		goal: "Every piece is yours. Clear 40 lines by quads. A mistake restarts the run.",
		onMistake: "restart",
		well: SIX_THREE_WELL,
		layout: "6-3",
		owned: [],
		start: "empty",
		lines: STAGE_LINES,
		ceiling: null,
	},
	{
		id: "convert",
		title: "Convert",
		goal: "Turn a downstacked 9-0 board into 6-3. Passes on the first lock that makes it quad-ready.",
		onMistake: "pause",
		well: SIX_THREE_WELL,
		layout: "6-3",
		owned: [],
		start: "convert",
		lines: null,
		ceiling: null,
	},
	{
		id: "eternal",
		title: "Eternal",
		goal: "The Eternal Exercise: 40 lines in quads from 8 garbage rows, with the stack below row 15.",
		onMistake: "pause",
		well: NINE_ZERO_WELL,
		layout: "9-0",
		owned: [],
		start: "eternal",
		lines: STAGE_LINES,
		ceiling: CEILING,
	},
];

export const wellStage = (id: WellStageId): WellStage => {
	const stage = WELL_STAGES.find((candidate) => candidate.id === id);

	if (!stage) throw new Error(`No Column wells stage ${id}`);

	return stage;
};
