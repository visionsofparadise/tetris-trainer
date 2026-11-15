import { useEffect, useMemo, useState } from "react";
import { slideNotes } from "../../utils/slideNotes";
import { PieceText } from "../Pieces/PieceText";
import { Shell } from "../Shell";
import { IconButton, PrimaryIconButton } from "../UI/IconButton";
import { ArrowIcon, PreviousIcon } from "../UI/Icons";
import { ListRowButton } from "../UI/ListRow";
import { LearnDemo } from "./LearnDemo";
import { LessonPanel } from "./LessonPanel";
import { SlideBoard } from "./SlideBoard";
import type { Opener } from "../../lessons/opener/Opener";
import type { AppContext } from "../../models/AppContext";
import type { View } from "../../models/View";

const HINTS = ["← → to change slides"];

const SLIDE_STEPS: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1 };

interface OpenerLearnProps {
	readonly opener: Opener;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

export function OpenerLearn({ opener, view, onNavigate, context }: OpenerLearnProps) {
	const { slides } = opener;
	const [index, setIndex] = useState(0);
	const slide = slides[index] ?? slides[0];
	const notes = useMemo(() => (slide ? slideNotes(slide) : []), [slide]);
	const last = slides.length - 1;

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const step = SLIDE_STEPS[event.code];

			if (step === undefined) return;

			event.preventDefault();
			setIndex((current) => Math.min(last, Math.max(0, current + step)));
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [last]);

	return (
		<Shell
			view={view}
			onNavigate={onNavigate}
			context={context}
			hints={HINTS}
			aside={
				<LessonPanel opener={opener} view={view} onNavigate={onNavigate}>
					<ol className="-mr-2 flex min-h-28 flex-1 flex-col gap-2 overflow-y-auto pr-2" aria-label="Slides">
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
						<IconButton label="Previous slide" disabled={index === 0} onClick={() => setIndex(index - 1)}>
							<PreviousIcon size={22} />
						</IconButton>
						<PrimaryIconButton label="Next slide" disabled={index === last} onClick={() => setIndex(index + 1)}>
							<ArrowIcon size={22} />
						</PrimaryIconButton>
					</div>
				</LessonPanel>
			}
		>
			{slide?.isDemo ? (
				<LearnDemo opener={opener} notes={notes} context={context} />
			) : (
				slide && <SlideBoard slide={slide} notes={notes} context={context} />
			)}
		</Shell>
	);
}
