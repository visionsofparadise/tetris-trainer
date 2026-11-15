import { placementCells } from "@tetris-trainer/game";
import { useMemo, useState } from "react";
import { loadBoard } from "../../lessons/opener/openerScript";
import { PlayArea } from "../Board/PlayArea";
import { PieceText } from "../Pieces/PieceText";
import { Shell } from "../Shell";
import { IconButton, PrimaryIconButton } from "../UI/IconButton";
import { ArrowIcon, PreviousIcon } from "../UI/Icons";
import { LabelRow } from "../UI/LabelRow";
import { ListRowButton } from "../UI/ListRow";
import { ProgressSegments } from "../UI/ProgressSegments";
import { LessonPanel } from "./LessonPanel";
import type { Opener } from "../../lessons/opener/Opener";
import type { AppContext } from "../../models/AppContext";
import type { BoardMark } from "../../models/BoardMark";
import type { View } from "../../models/View";

const pad = (value: number): string => String(value).padStart(2, "0");

interface OpenerRulesProps {
	readonly opener: Opener;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

export function OpenerRules({ opener, view, onNavigate, context }: OpenerRulesProps) {
	const { slides } = opener;
	const [index, setIndex] = useState(0);
	const slide = slides[index] ?? slides[0];
	const game = useMemo(() => loadBoard(slide?.board ?? []), [slide]);
	const marks = useMemo(
		(): Array<BoardMark> =>
			(slide?.marks ?? []).map((placement) => ({ cells: placementCells(placement), tone: "target" })),
		[slide],
	);

	return (
		<Shell
			view={view}
			onNavigate={onNavigate}
			context={context}
			hints={["Hatched: the piece this rule is about"]}
			aside={
				<LessonPanel opener={opener} view={view} onNavigate={onNavigate}>
					<div className="flex flex-col gap-2.5">
						<LabelRow label="Rules" detail={`${pad(index + 1)} / ${pad(slides.length)}`} />
						<ProgressSegments total={slides.length} done={index + 1} label="Rules read" />
					</div>
					<section className="flex flex-col gap-2" aria-live="polite">
						<h2 className="heading text-xl">
							<PieceText text={slide?.title ?? ""} />
						</h2>
						<p className="text-sm leading-relaxed">
							<PieceText text={slide?.text ?? ""} />
						</p>
					</section>
					<ol className="-mr-2 flex min-h-28 flex-1 flex-col gap-1.5 overflow-y-auto pr-2">
						{slides.map(({ title }, slideIndex) => (
							<ListRowButton
								key={title}
								number={slideIndex + 1}
								title={<PieceText text={title} />}
								isCurrent={slideIndex === index}
								onClick={() => setIndex(slideIndex)}
							/>
						))}
					</ol>
					<div className="flex justify-between gap-2">
						<IconButton label="Previous rule" disabled={index === 0} onClick={() => setIndex(index - 1)}>
							<PreviousIcon size={22} />
						</IconButton>
						<PrimaryIconButton
							label="Next rule"
							disabled={index === slides.length - 1}
							onClick={() => setIndex(index + 1)}
						>
							<ArrowIcon size={22} />
						</PrimaryIconButton>
					</div>
				</LessonPanel>
			}
		>
			<PlayArea
				game={game}
				handling={context.settings.config.handling}
				context={context}
				marks={marks}
				display="board"
			/>
		</Shell>
	);
}
