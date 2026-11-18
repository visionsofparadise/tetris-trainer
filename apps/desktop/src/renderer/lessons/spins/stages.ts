import type { TargetStage } from "../target/targetDrill";

export const SPIN_STAGES: ReadonlyArray<TargetStage> = [
	{
		id: "s-z",
		title: "S/Z",
		goal: "Spin the S or Z into the spot each board offers. 10 in a row passes.",
		onMistake: "pause",
		families: ["s-z"],
		streak: 10,
	},
	{
		id: "l-j",
		title: "L/J",
		goal: "Spin the L or J into the spot each board offers. 10 in a row passes.",
		onMistake: "pause",
		families: ["l-j"],
		streak: 10,
	},
	{
		id: "mixed",
		title: "Mixed",
		goal: "S, Z, L, J and T spins mixed: score the spin each board offers. 20 in a row passes.",
		onMistake: "pause",
		families: ["s-z", "l-j", "tsd", "mini"],
		streak: 20,
	},
];
