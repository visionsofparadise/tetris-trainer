import { BoardCard } from "../UI/BoardCard";
import { PrimaryIconButton } from "../UI/IconButton";
import { PauseIcon, PlayIcon } from "../UI/Icons";

interface PausedCardProps {
	readonly onResume: () => void;
}

export function PausedCard({ onResume }: PausedCardProps) {
	return (
		<BoardCard tone="muted" icon={<PauseIcon size={20} />} title="Paused">
			<PrimaryIconButton label="Resume" onClick={onResume}>
				<PlayIcon size={22} />
			</PrimaryIconButton>
		</BoardCard>
	);
}
