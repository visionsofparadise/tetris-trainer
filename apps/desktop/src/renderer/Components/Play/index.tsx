import { useCallback, useState } from "react";
import { PAUSE_HINT, usePause } from "../../hooks/usePause";
import { retryHints } from "../../utils/retryHints";
import { PauseButton } from "../Chrome/PauseButton";
import { LessonList } from "../Lessons/LessonList";
import { SettingsPanel } from "../Settings/SettingsPanel";
import { Shell } from "../Shell";
import { ReplayIcon } from "../UI/Icons";
import { GameSession } from "./GameSession";
import type { AppContext } from "../../models/AppContext";
import type { View } from "../../models/View";

interface PlayProps {
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

export function Play({ view, onNavigate, context }: PlayProps) {
	const [run, setRun] = useState(0);
	const pause = usePause(context);
	const { resume } = pause;
	const handleRestart = useCallback(() => {
		resume();
		setRun((count) => count + 1);
	}, [resume]);

	return (
		<Shell
			view={view}
			onNavigate={onNavigate}
			context={context}
			hints={[...retryHints(context.settings.config, "restart"), PAUSE_HINT]}
			actions={
				<>
					<PauseButton pause={pause} />
					<button type="button" className="no-drag icon-button" aria-label="Restart" onClick={handleRestart}>
						<ReplayIcon />
					</button>
				</>
			}
			aside={
				view === "settings" ? (
					<SettingsPanel onLoad={handleRestart} context={context} />
				) : (
					<LessonList onNavigate={onNavigate} context={context} />
				)
			}
		>
			<GameSession key={run} pause={pause} onRestart={handleRestart} context={context} />
		</Shell>
	);
}
