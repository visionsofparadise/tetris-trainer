import { formatGameTime } from "../../utils/formatGameTime";
import type { GameStats } from "@tetris-trainer/game";

interface GameOverProps {
	readonly stats: GameStats;
	readonly onRestart: () => void;
	readonly onExit: () => void;
}

export function GameOver({ stats, onRestart, onExit }: GameOverProps) {
	return (
		<div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-surface/80">
			<h2 className="text-3xl font-bold">Game over</h2>
			<dl className="grid grid-cols-2 gap-x-8 gap-y-1 tabular-nums">
				<dt className="text-muted">Pieces</dt>
				<dd className="text-right">{stats.pieces}</dd>
				<dt className="text-muted">Lines</dt>
				<dd className="text-right">{stats.lines}</dd>
				<dt className="text-muted">Time</dt>
				<dd className="text-right">{formatGameTime(stats.frames)}</dd>
			</dl>
			<div className="flex gap-3">
				<button className="button" type="button" onClick={onRestart}>
					Restart
				</button>
				<button className="button-secondary" type="button" onClick={onExit}>
					Menu
				</button>
			</div>
		</div>
	);
}
