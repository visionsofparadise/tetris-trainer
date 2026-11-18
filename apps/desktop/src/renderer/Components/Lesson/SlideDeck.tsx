import { useEffect, useState } from "react";
import { PAUSE_HINT, usePause } from "../../hooks/usePause";
import { PauseButton } from "../Chrome/PauseButton";
import { PieceText } from "../Pieces/PieceText";
import { Shell } from "../Shell";
import { IconButton, PrimaryIconButton } from "../UI/IconButton";
import { ArrowIcon, PreviousIcon } from "../UI/Icons";
import { ListRowButton } from "../UI/ListRow";
import { LessonPanel } from "./LessonPanel";
import type { LessonScreenProps } from "../../models/Lesson";
import type { PauseControl } from "../../models/PauseControl";
import type { ReactNode } from "react";

const SLIDE_HINT = "← → to change slides";

const SLIDE_HINTS = [SLIDE_HINT];

const LIVE_HINTS = [SLIDE_HINT, PAUSE_HINT];

const SLIDE_STEPS: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1 };

export interface DeckSlide {
	readonly title: string;
	readonly isLive?: boolean;
}

interface SlideDeckProps<S extends DeckSlide> extends LessonScreenProps {
	readonly slides: ReadonlyArray<S>;
	readonly renderSlide: (slide: S, pause: PauseControl) => ReactNode;
	readonly empty?: ReactNode;
}

export function SlideDeck<S extends DeckSlide>({
	slides,
	renderSlide,
	empty,
	lesson,
	view,
	onNavigate,
	context,
}: SlideDeckProps<S>) {
	const [index, setIndex] = useState(0);
	const slide = slides[index] ?? slides[0];
	const last = slides.length - 1;
	const isLive = slide?.isLive === true;
	const pause = usePause(context, isLive);
	const { resume } = pause;

	useEffect(() => resume(), [index, resume]);

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
			actions={isLive ? <PauseButton pause={pause} /> : undefined}
			hints={isLive ? LIVE_HINTS : SLIDE_HINTS}
			aside={
				<LessonPanel lesson={lesson} view={view} onNavigate={onNavigate}>
					<ol className="-mr-2 flex min-h-28 flex-1 flex-col gap-3 overflow-y-auto pr-2" aria-label="Slides">
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
						<PrimaryIconButton label="Next slide" disabled={index >= last} onClick={() => setIndex(index + 1)}>
							<ArrowIcon size={22} />
						</PrimaryIconButton>
					</div>
				</LessonPanel>
			}
		>
			{slide ? renderSlide(slide, pause) : empty}
		</Shell>
	);
}
