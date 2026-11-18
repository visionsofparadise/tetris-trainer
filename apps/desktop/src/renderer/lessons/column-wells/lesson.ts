import { createElement } from "react";
import { BoardSlide } from "../../Components/Drill/BoardSlide";
import { drillLesson } from "../drill/drillLesson";
import { withDevBoard } from "./devBoards";
import { WELLS_SLIDES } from "./slides";
import { WELLS_DRILL } from "./wellsDrill";

export const COLUMN_WELLS = drillLesson({
	id: "column-wells",
	title: "Column wells",
	detail: "Stack 9-0 and 6-3 around one open column and clear by quads.",
	learn: {
		slides: WELLS_SLIDES,
		renderSlide: (slide, _pause, context) => createElement(BoardSlide, { slide, context }),
	},
	drill: import.meta.env.DEV
		? withDevBoard(WELLS_DRILL, new URLSearchParams(window.location.search).get("board"))
		: WELLS_DRILL,
	showNext: true,
});
