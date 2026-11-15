import { formatClock } from "../../utils/formatGameTime";
import { PieceIcon } from "../Pieces/PieceIcon";
import { LabelRow } from "../UI/LabelRow";
import { StatRow } from "./StatRow";
import type { GameReadout } from "../../hooks/useGameReadout";

const FRAMES_PER_SECOND = 60;

const pad = (value: number): string => String(value).padStart(3, "0");

const piecesPerSecond = ({ pieces, frames }: GameReadout): string =>
	frames === 0 ? "0.00" : (pieces / (frames / FRAMES_PER_SECOND)).toFixed(2);

interface HoldColumnProps {
	readonly readout: GameReadout;
	readonly holdKey: string;
}

export function HoldColumn({ readout, holdKey }: HoldColumnProps) {
	return (
		<div className="relative flex w-(--side-width) shrink-0 flex-col gap-2.5">
			<LabelRow label="Hold" detail={`[${holdKey}]`} className="absolute inset-x-0 bottom-full mb-2.5" />
			<div
				className="flex h-(--hold-height) items-center justify-center bg-panel text-(length:--preview-cell)"
				data-anchor="hold"
			>
				{readout.hold && <PieceIcon mino={readout.hold} />}
			</div>
			<section className="flex flex-col gap-3 bg-panel p-3" aria-label="Stats">
				<LabelRow label="Stats" />
				<dl className="flex flex-col gap-2.5">
					<StatRow label="Pieces" value={pad(readout.pieces)} />
					<StatRow label="Lines" value={String(readout.lines)} />
					<StatRow label="PPS" value={piecesPerSecond(readout)} />
					<StatRow label="Time" value={formatClock(readout.frames)} />
				</dl>
			</section>
		</div>
	);
}
