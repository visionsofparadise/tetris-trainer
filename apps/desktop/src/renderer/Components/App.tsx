import { useCallback, useMemo, useState } from "react";
import { TKI } from "../lessons/tki";
import { mainEvents } from "../models/mainEventsOfWindow";
import { createSettings } from "../models/Settings";
import { START, toward, type Navigation } from "../utils/navigation";
import { OpenerLearn } from "./Opener/OpenerLearn";
import { OpenerPractice } from "./Opener/OpenerPractice";
import { OpenerWatch } from "./Opener/OpenerWatch";
import { Play } from "./Play";
import type { AppContext } from "../models/AppContext";
import type { View } from "../models/View";

export function App() {
	const [settings] = useState(() => createSettings(localStorage));
	const context = useMemo<AppContext>(() => ({ main: window.main, mainEvents, settings }), [settings]);
	const [{ view }, setNavigation] = useState<Navigation>(START);
	const navigate = useCallback((next: View) => setNavigation((current) => toward(current, next)), []);

	switch (view) {
		case "free-play":
		case "settings":
			return <Play view={view} onNavigate={navigate} context={context} />;
		case "tki-learn":
			return <OpenerLearn opener={TKI} view={view} onNavigate={navigate} context={context} />;
		case "tki-watch":
			return <OpenerWatch opener={TKI} view={view} onNavigate={navigate} context={context} />;
		case "tki-practice":
			return <OpenerPractice opener={TKI} view={view} onNavigate={navigate} context={context} />;
	}
}
