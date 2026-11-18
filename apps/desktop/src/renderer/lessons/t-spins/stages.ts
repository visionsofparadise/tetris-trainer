import type { TargetStage } from "../target/targetDrill";

export const T_SPIN_STAGES: ReadonlyArray<TargetStage> = [
	{
		id: "single",
		title: "Single",
		goal: "Score a T-spin single on each board. 10 in a row passes.",
		onMistake: "pause",
		families: ["tss"],
		streak: 10,
	},
	{
		id: "double",
		title: "Double",
		goal: "Score a T-spin double on each board. 10 in a row passes.",
		onMistake: "pause",
		families: ["tsd"],
		streak: 10,
	},
	{
		id: "mini",
		title: "Mini",
		goal: "Score the T-spin mini each board offers. 10 in a row passes.",
		onMistake: "pause",
		families: ["mini"],
		streak: 10,
	},
	{
		id: "triple",
		title: "Triple",
		goal: "Score a T-spin triple on each board. 10 in a row passes.",
		onMistake: "pause",
		families: ["tst"],
		streak: 10,
	},
	{
		id: "mixed",
		title: "Mixed",
		goal: "Score the spin each board offers. 20 in a row passes.",
		onMistake: "pause",
		families: ["tss", "tsd", "mini", "tst"],
		streak: 20,
	},
];
