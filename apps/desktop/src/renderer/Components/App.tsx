import { useCallback, useMemo, useState } from "react";
import { mainEvents } from "../models/mainEventsOfWindow";
import { createSettings } from "../models/Settings";
import { Menu } from "./Menu";
import { Play } from "./Play";
import type { AppContext } from "../models/AppContext";

export function App() {
	const [settings] = useState(() => createSettings(localStorage));
	const context = useMemo<AppContext>(() => ({ main: window.main, mainEvents, settings }), [settings]);
	const [screen, setScreen] = useState<"menu" | "play">("menu");
	const handleStart = useCallback(() => setScreen("play"), []);
	const handleExit = useCallback(() => setScreen("menu"), []);

	return (
		<main className="flex h-dvh items-center justify-center p-6">
			{screen === "menu" ? (
				<Menu onStart={handleStart} context={context} />
			) : (
				<Play onExit={handleExit} context={context} />
			)}
		</main>
	);
}
