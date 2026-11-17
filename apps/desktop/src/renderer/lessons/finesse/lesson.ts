import { createElement } from "react";
import { FinesseSlide } from "../../Components/Finesse/FinesseSlide";
import { drillLesson } from "../drill/drillLesson";
import { FINESSE_DRILL } from "./finesseDrill";
import { FINESSE_SLIDES } from "./slides";

export const FINESSE = drillLesson({
	id: "finesse",
	title: "Finesse",
	detail: "The fewest key presses for every spot on an empty board.",
	learn: {
		slides: FINESSE_SLIDES,
		renderSlide: (slide, pause, context) => createElement(FinesseSlide, { slide, pause, context }),
	},
	drill: FINESSE_DRILL,
	showNext: false,
});
