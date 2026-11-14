import { useMemo, useState } from "react";
import { TKI_OPENER } from "../lessons/tkiOpener";
import { mainEvents } from "../models/mainEventsOfWindow";
import { createSettings } from "../models/Settings";
import { Lesson } from "./Lesson";
import { Navigation } from "./Navigation";
import { Play } from "./Play";
import type { AppContext } from "../models/AppContext";
import type { View } from "../models/View";

export function App() {
	const [settings] = useState(() => createSettings(localStorage));
	const context = useMemo<AppContext>(() => ({ main: window.main, mainEvents, settings }), [settings]);
	const [view, setView] = useState<View>("free-play");
	const navigation = <Navigation view={view} onSelect={setView} />;

	return view === "free-play" ? (
		<Play navigation={navigation} context={context} />
	) : (
		<Lesson lesson={TKI_OPENER} navigation={navigation} context={context} />
	);
}
