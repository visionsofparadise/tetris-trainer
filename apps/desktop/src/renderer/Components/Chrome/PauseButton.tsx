import { PauseIcon, PlayIcon } from "../UI/Icons";
import type { PauseControl } from "../../models/PauseControl";

interface PauseButtonProps {
	readonly pause: PauseControl;
}

export function PauseButton({ pause }: PauseButtonProps) {
	const label = pause.isPaused ? "Resume" : "Pause";

	return (
		<button
			type="button"
			className="no-drag icon-button"
			aria-label={label}
			title={label}
			aria-pressed={pause.isPaused}
			onClick={pause.toggle}
		>
			{pause.isPaused ? <PlayIcon /> : <PauseIcon />}
		</button>
	);
}
