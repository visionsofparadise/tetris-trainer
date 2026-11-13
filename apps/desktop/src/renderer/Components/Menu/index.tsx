import { ConfigPicker } from "./ConfigPicker";
import type { AppContext } from "../../models/AppContext";

interface MenuProps {
	readonly onStart: () => void;
	readonly context: AppContext;
}

export function Menu({ onStart, context }: MenuProps) {
	return (
		<div className="flex flex-col items-center gap-10">
			<h1 className="text-4xl font-bold text-balance">Tetris Trainer</h1>
			<button className="button" type="button" onClick={onStart}>
				Start game
			</button>
			<ConfigPicker context={context} />
		</div>
	);
}
