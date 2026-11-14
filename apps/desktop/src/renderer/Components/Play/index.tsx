import { useCallback, useState, type ReactNode } from "react";
import { ConfigPicker } from "../ConfigPicker";
import { Shell } from "../Shell";
import { GameSession } from "./GameSession";
import type { AppContext } from "../../models/AppContext";

interface PlayProps {
	readonly navigation: ReactNode;
	readonly context: AppContext;
}

export function Play({ navigation, context }: PlayProps) {
	const [run, setRun] = useState(0);
	const handleRestart = useCallback(() => setRun((count) => count + 1), []);

	return (
		<Shell
			navigation={navigation}
			controls={
				<>
					<h1 className="text-2xl font-bold">Free play</h1>
					<button className="button-secondary self-start" type="button" onClick={handleRestart}>
						Restart
					</button>
					<ConfigPicker onLoad={handleRestart} context={context} />
				</>
			}
		>
			<GameSession key={run} onRestart={handleRestart} context={context} />
		</Shell>
	);
}
