import { createElement } from "react";
import { BoardSlide } from "../../Components/Drill/BoardSlide";
import { drillLesson } from "../drill/drillLesson";
import { targetDrill } from "../target/targetDrill";
import { DROP_SLIDES } from "./slides";
import { DROP_STAGES } from "./stages";

export const DROP_CHOICE = drillLesson({
	id: "drop-choice",
	title: "Drop choice",
	detail: "Hard drop where nothing covers the spot, and slide under an overhang where something does.",
	learn: {
		slides: DROP_SLIDES,
		renderSlide: (slide, _pause, context) => createElement(BoardSlide, { slide, context }),
	},
	drill: targetDrill({ stages: DROP_STAGES, watch: ["hard-drop", "tuck"] }),
	showNext: false,
});
