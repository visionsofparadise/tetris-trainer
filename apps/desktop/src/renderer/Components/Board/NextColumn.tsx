import { NEXT_COUNT, type Mino } from "@tetris-trainer/game";
import { cn } from "../../utils/cn";
import { PieceIcon } from "../Pieces/PieceIcon";
import { LabelRow } from "../UI/LabelRow";
import { StatRow } from "./StatRow";

const pad = (value: number): string => String(value).padStart(2, "0");

interface NextColumnProps {
	readonly next: ReadonlyArray<Mino>;
	readonly height: number;
	readonly holes: number;
}

export function NextColumn({ next, height, holes }: NextColumnProps) {
	return (
		<div className="relative flex h-(--well-height) w-(--side-width) shrink-0 flex-col justify-between gap-2.5">
			<LabelRow label="Next" className="absolute inset-x-0 bottom-full mb-2.5 justify-end" />
			<ol className="bg-panel py-1.5 text-(length:--preview-cell)" aria-label="Next pieces" data-anchor="next">
				{Array.from({ length: NEXT_COUNT }, (_, index) => {
					const mino = next[index];

					return (
						<li
							key={index}
							className={cn("flex h-(--next-slot) items-center justify-center", index > 0 && "opacity-75")}
						>
							{mino !== undefined && <PieceIcon mino={mino} />}
						</li>
					);
				})}
			</ol>
			<section className="flex flex-col gap-3 bg-panel p-3" aria-label="Board">
				<LabelRow label="Board" />
				<dl className="flex flex-col gap-2.5">
					<StatRow label="Height" value={pad(height)} />
					<StatRow label="Holes" value={pad(holes)} />
				</dl>
			</section>
		</div>
	);
}
