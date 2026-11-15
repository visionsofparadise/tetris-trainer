import { NEXT_COUNT, type Mino } from "@tetris-trainer/game";
import { cn } from "../../utils/cn";
import { PieceIcon } from "../Pieces/PieceIcon";
import { LabelRow } from "../UI/LabelRow";

interface NextColumnProps {
	readonly next: ReadonlyArray<Mino>;
}

export function NextColumn({ next }: NextColumnProps) {
	return (
		<div className="relative w-(--side-width) shrink-0">
			<LabelRow label="Next" className="absolute inset-x-0 bottom-full mb-2.5 justify-end" />
			<ol className="bg-panel py-2 text-(length:--preview-cell)" aria-label="Next pieces">
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
		</div>
	);
}
