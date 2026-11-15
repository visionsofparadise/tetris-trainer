import { useMemo, useState } from "react";
import { TKI } from "../lessons/tki";
import { mainEvents } from "../models/mainEventsOfWindow";
import { createSettings } from "../models/Settings";
import { OpenerLearn } from "./Opener/OpenerLearn";
import { OpenerPractice } from "./Opener/OpenerPractice";
import { OpenerWatch } from "./Opener/OpenerWatch";
import { Play } from "./Play";
import type { AppContext } from "../models/AppContext";
import type { View } from "../models/View";

export function App() {
	const [settings] = useState(() => createSettings(localStorage));
	const context = useMemo<AppContext>(() => ({ main: window.main, mainEvents, settings }), [settings]);
	const [view, setView] = useState<View>("free-play");

	switch (view) {
		case "free-play":
		case "settings":
			return <Play view={view} onNavigate={setView} context={context} />;
		case "tki-learn":
			return <OpenerLearn opener={TKI} view={view} onNavigate={setView} context={context} />;
		case "tki-watch":
			return <OpenerWatch opener={TKI} view={view} onNavigate={setView} context={context} />;
		case "tki-practice":
			return <OpenerPractice opener={TKI} view={view} onNavigate={setView} context={context} />;
	}
}
