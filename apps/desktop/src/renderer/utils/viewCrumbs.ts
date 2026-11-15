import { LESSON_GROUPS } from "./lessonCatalog";
import type { View } from "../models/View";

export interface Crumb {
	readonly label: string;
	readonly view: View;
}

const PAGE_CRUMBS: Partial<Record<View, ReadonlyArray<Crumb>>> = {
	"free-play": [{ label: "Free play", view: "free-play" }],
	settings: [{ label: "Settings", view: "settings" }],
};

const lessonCrumbs = (view: View): ReadonlyArray<Crumb> => {
	for (const { lessons } of LESSON_GROUPS)
		for (const { title, sections } of lessons) {
			const section = sections.find((candidate) => candidate.view === view);
			const [first] = sections;

			if (section && first)
				return [
					{ label: "Lessons", view: "free-play" },
					{ label: title, view: first.view },
					{ label: section.title, view },
				];
		}

	return [];
};

export const viewCrumbs = (view: View): ReadonlyArray<Crumb> => PAGE_CRUMBS[view] ?? lessonCrumbs(view);
