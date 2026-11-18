import type { TargetStage } from "../target/targetDrill";

export const DROP_STAGES: ReadonlyArray<TargetStage> = [
	{
		id: "hard-drop",
		title: "Hard drop",
		goal: "Land each piece on its spot. A soft drop where a hard drop reaches is a miss. 10 in a row passes.",
		onMistake: "pause",
		families: ["hard-drop"],
		streak: 10,
	},
	{
		id: "slide",
		title: "Slide",
		goal: "Slide each piece under its overhang. 10 in a row passes.",
		onMistake: "pause",
		families: ["tuck"],
		streak: 10,
	},
	{
		id: "mixed",
		title: "Mixed",
		goal: "Hard drop or slide, whichever the spot needs. 20 in a row passes.",
		onMistake: "pause",
		families: ["hard-drop", "tuck"],
		streak: 20,
	},
];
