import { BoardCard } from "../UI/BoardCard";
import { PauseIcon } from "../UI/Icons";

export function PausedCard() {
	return <BoardCard tone="muted" icon={<PauseIcon size={20} />} title="Paused" />;
}
