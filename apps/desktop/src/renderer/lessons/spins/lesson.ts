import { createElement } from "react";
import { BoardSlide } from "../../Components/Drill/BoardSlide";
import { drillLesson } from "../drill/drillLesson";
import { targetDrill } from "../target/targetDrill";
import { SPIN_SLIDES } from "./slides";
import { SPIN_STAGES } from "./stages";

export const SPINS = drillLesson({
	id: "spins",
	title: "Spins and kicks",
	detail: "Kick S, Z, L and J into spots they cannot leave for mini spins.",
	learn: {
		slides: SPIN_SLIDES,
		renderSlide: (slide, _pause, context) => createElement(BoardSlide, { slide, context }),
	},
	drill: targetDrill({ stages: SPIN_STAGES, watch: ["s-z", "l-j"] }),
	showNext: false,
});
