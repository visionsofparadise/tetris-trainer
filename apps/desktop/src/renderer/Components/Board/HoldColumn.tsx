import { cn } from "../../utils/cn";
import { formatClock } from "../../utils/formatGameTime";
import { PieceIcon } from "../Pieces/PieceIcon";
import { LabelRow } from "../UI/LabelRow";
import { StatRow } from "./StatRow";
import type { GameReadout } from "../../hooks/useGameReadout";
import type { ClearReadout } from "../../hooks/useLastClear";

const FRAMES_PER_SECOND = 60;

const pad = (value: number): string => String(value).padStart(3, "0");

const piecesPerSecond = ({ pieces, frames }: GameReadout): string =>
	frames === 0 ? "0.00" : (pieces / (frames / FRAMES_PER_SECOND)).toFixed(2);

const streak = (count: number, prefix = ""): string => (count > 0 ? `${prefix}${count}` : "—");

interface HoldColumnProps {
	readonly readout: GameReadout;
	readonly clear: ClearReadout;
	readonly holdKey: string;
}

export function HoldColumn({ readout, clear, holdKey }: HoldColumnProps) {
	return (
		<div className="relative flex w-(--side-width) shrink-0 flex-col gap-2.5">
			<LabelRow label="Hold" detail={`[${holdKey}]`} className="absolute inset-x-0 bottom-full mb-2.5" />
			<div
				className="flex h-(--hold-height) items-center justify-center bg-panel text-(length:--preview-cell)"
				data-anchor="hold"
			>
				{readout.hold && <PieceIcon mino={readout.hold} />}
			</div>
			<section className="flex flex-col gap-3 pt-2" aria-label="Stats">
				<LabelRow label="Stats" />
				<dl className="flex flex-col gap-2.5">
					<StatRow label="Pieces" value={pad(readout.pieces)} />
					<StatRow label="Lines" value={String(readout.lines)} />
					<StatRow label="Attack" value={String(readout.attack)} />
					<StatRow label="PPS" value={piecesPerSecond(readout)} />
					<StatRow label="Time" value={formatClock(readout.frames)} />
				</dl>
			</section>
			<section className="flex flex-col gap-3 pt-2" aria-label="Last clear" aria-live="polite">
				<LabelRow label="Clear" />
				<p className={cn("heading text-[15px] leading-tight text-balance", !clear.name && "text-muted/50")}>
					{clear.name ?? "—"}
				</p>
				<dl className="flex flex-col gap-2.5">
					<StatRow label="Sent" value={clear.name ? `+${clear.attack}` : "—"} />
					<StatRow label="Combo" value={streak(clear.combo)} />
					<StatRow label="B2B" value={streak(clear.b2b, "×")} />
				</dl>
			</section>
		</div>
	);
}
