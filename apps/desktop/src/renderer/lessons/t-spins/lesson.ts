import { createElement } from "react";
import { BoardSlide } from "../../Components/Drill/BoardSlide";
import { drillLesson } from "../drill/drillLesson";
import { targetDrill } from "../target/targetDrill";
import { T_SPIN_SLIDES } from "./slides";
import { T_SPIN_STAGES } from "./stages";

export const T_SPINS = drillLesson({
	id: "t-spins",
	title: "T-spins",
	detail: "Spin the T into its slot for a single, double, mini or triple.",
	learn: {
		slides: T_SPIN_SLIDES,
		renderSlide: (slide, _pause, context) => createElement(BoardSlide, { slide, context }),
	},
	drill: targetDrill({ stages: T_SPIN_STAGES, watch: ["tsd", "tss", "mini", "tst"] }),
	showNext: false,
});
