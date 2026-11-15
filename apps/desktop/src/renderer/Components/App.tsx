import { Fragment, useCallback, useEffect, useState } from "react";
import { LESSON_GROUPS } from "../lessons/catalog";
import { mainEvents } from "../models/mainEventsOfWindow";
import { createSettings } from "../models/Settings";
import { createSound } from "../utils/createSound";
import { findLessonPlace } from "../utils/lessonViews";
import { restoreNavigation, toward, type Navigation } from "../utils/navigation";
import { Play } from "./Play";
import type { AppContext } from "../models/AppContext";
import type { View } from "../models/View";

interface AppProps {
	readonly savedSettings: string | null;
}

export function App({ savedSettings }: AppProps) {
	const [context] = useState<AppContext>(() => {
		const settings = createSettings(savedSettings, window.main.writeSettings);

		return { main: window.main, mainEvents, settings, sound: createSound(settings), lessons: LESSON_GROUPS };
	});
	const [{ view }, setNavigation] = useState<Navigation>(() =>
		restoreNavigation(context.lessons, window.location.hash),
	);
	const navigate = useCallback((next: View) => setNavigation((current) => toward(current, next)), []);

	useEffect(() => window.history.replaceState(null, "", `#${view}`), [view]);

	if (view === "free-play" || view === "settings") return <Play view={view} onNavigate={navigate} context={context} />;

	const place = findLessonPlace(context.lessons, view);

	if (!place) return <Play view="free-play" onNavigate={navigate} context={context} />;

	return (
		<Fragment key={view}>
			{place.section.render({ lesson: place.lesson, view, onNavigate: navigate, context })}
		</Fragment>
	);
}
