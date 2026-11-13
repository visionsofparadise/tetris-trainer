import { useCallback, useState } from "react";
import { GameSession } from "./GameSession";
import type { AppContext } from "../../models/AppContext";

interface PlayProps {
	readonly onExit: () => void;
	readonly context: AppContext;
}

export function Play({ onExit, context }: PlayProps) {
	const [run, setRun] = useState(0);
	const handleRestart = useCallback(() => setRun((count) => count + 1), []);

	return <GameSession key={run} onRestart={handleRestart} onExit={onExit} context={context} />;
}
