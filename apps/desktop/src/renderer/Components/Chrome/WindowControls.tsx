import { CloseIcon, MaximiseIcon, MinimiseIcon } from "../UI/Icons";
import type { AppContext } from "../../models/AppContext";

interface WindowControlsProps {
	readonly context: AppContext;
}

export function WindowControls({ context }: WindowControlsProps) {
	const { main } = context;

	return (
		<div className="no-drag ml-4 flex border-l border-white/15 pl-4">
			<button
				type="button"
				className="window-button"
				aria-label="Minimise"
				onClick={() => void main.minimizeWindow()}
			>
				<MinimiseIcon />
			</button>
			<button
				type="button"
				className="window-button"
				aria-label="Maximise"
				onClick={() => void main.toggleMaximizeWindow()}
			>
				<MaximiseIcon />
			</button>
			<button
				type="button"
				className="window-button window-button-close"
				aria-label="Close"
				onClick={() => void main.closeWindow()}
			>
				<CloseIcon />
			</button>
		</div>
	);
}
