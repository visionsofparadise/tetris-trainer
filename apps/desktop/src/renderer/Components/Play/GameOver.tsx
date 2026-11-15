import { BoardCard } from "../UI/BoardCard";
import { PrimaryIconButton } from "../UI/IconButton";
import { CrossIcon, ReplayIcon } from "../UI/Icons";

interface GameOverProps {
	readonly onRestart: () => void;
}

export function GameOver({ onRestart }: GameOverProps) {
	return (
		<BoardCard tone="pink" icon={<CrossIcon size={20} />} title="Game over">
			<PrimaryIconButton label="Restart" className="pointer-events-auto" onClick={onRestart}>
				<ReplayIcon size={22} />
			</PrimaryIconButton>
		</BoardCard>
	);
}
