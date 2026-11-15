import { formatClock } from "../../utils/formatGameTime";
import { handlingLines } from "../../utils/formatHandling";
import { PieceIcon } from "../Pieces/PieceIcon";
import { LabelRow } from "../UI/LabelRow";
import { StatRow } from "./StatRow";
import type { GameReadout } from "../../hooks/useGameReadout";
import type { Handling } from "@tetris-trainer/game";

const FRAMES_PER_SECOND = 60;

const pad = (value: number): string => String(value).padStart(3, "0");

const piecesPerSecond = ({ pieces, frames }: GameReadout): string =>
	frames === 0 ? "0.00" : (pieces / (frames / FRAMES_PER_SECOND)).toFixed(2);

interface HoldColumnProps {
	readonly readout: GameReadout;
	readonly holdKey: string;
	readonly handling: Handling;
}

export function HoldColumn({ readout, holdKey, handling }: HoldColumnProps) {
	return (
		<div className="relative flex h-(--well-height) w-(--side-width) shrink-0 flex-col justify-between">
			<LabelRow label="Hold" detail={`[${holdKey}]`} className="absolute inset-x-0 bottom-full mb-2.5" />
			<div className="flex flex-col gap-2.5">
				<div className="flex h-(--hold-height) items-center justify-center bg-panel text-(length:--preview-cell)">
					{readout.hold && <PieceIcon mino={readout.hold} />}
				</div>
				<section className="flex flex-col gap-2.5 bg-panel p-3" aria-label="Stats">
					<LabelRow label="Stats" />
					<dl className="flex flex-col gap-2.5">
						<StatRow label="Pcs" value={pad(readout.pieces)} />
						<StatRow label="Lines" value={String(readout.lines)} />
						<StatRow label="PPS" value={piecesPerSecond(readout)} />
						<StatRow label="Time" value={formatClock(readout.frames)} />
					</dl>
				</section>
			</div>
			<div className="flex flex-col gap-1">
				{handlingLines(handling).map((line) => (
					<span key={line} className="caption">
						{line}
					</span>
				))}
			</div>
		</div>
	);
}
