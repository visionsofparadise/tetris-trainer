import { useMemo, useState } from "react";
import { TKI } from "../lessons/tki";
import { mainEvents } from "../models/mainEventsOfWindow";
import { createSettings } from "../models/Settings";
import { Navigation } from "./Navigation";
import { OpenerPractice } from "./Opener/OpenerPractice";
import { OpenerRules } from "./Opener/OpenerRules";
import { OpenerWatch } from "./Opener/OpenerWatch";
import { Play } from "./Play";
import type { AppContext } from "../models/AppContext";
import type { View } from "../models/View";

export function App() {
	const [settings] = useState(() => createSettings(localStorage));
	const context = useMemo<AppContext>(() => ({ main: window.main, mainEvents, settings }), [settings]);
	const [view, setView] = useState<View>("free-play");
	const navigation = <Navigation view={view} onSelect={setView} />;

	switch (view) {
		case "free-play":
			return <Play navigation={navigation} context={context} />;
		case "tki-rules":
			return <OpenerRules opener={TKI} navigation={navigation} />;
		case "tki-watch":
			return <OpenerWatch opener={TKI} navigation={navigation} />;
		case "tki-practice":
			return <OpenerPractice opener={TKI} navigation={navigation} context={context} />;
	}
}
