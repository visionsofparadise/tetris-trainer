import { createMutableState } from "opshot";
import { scope } from "opshot/react";
import { useCallback, useEffect, useState } from "react";
import { PAUSE_HINT, usePause } from "../../hooks/usePause";
import {
	createDrillWatch,
	dealDrillWatch,
	setDrillWatchSpeed,
	type DealWatch,
	type DrillWatchSession,
} from "../../lessons/drill/drillWatch";
import { playerOf } from "../../lessons/drill/player";
import { PlayArea } from "../Board/PlayArea";
import { SuccessFlash } from "../Board/SuccessFlash";
import { LessonShell } from "../Lesson/LessonShell";
import { SpeedSlider } from "../Lesson/SpeedSlider";
import { PieceText } from "../Pieces/PieceText";
import { IconButton } from "../UI/IconButton";
import { ArrowIcon } from "../UI/Icons";
import { LabelRow } from "../UI/LabelRow";
import { ListRow } from "../UI/ListRow";
import type { DrillWords } from "../../lessons/drill/Drill";
import type { AppContext } from "../../models/AppContext";
import type { Lesson, LessonScreenProps } from "../../models/Lesson";
import type { View } from "../../models/View";

const SPEED_STEPS: ReadonlyArray<number> = [0.5, 0.75, 1];

const WATCH_HINTS = [PAUSE_HINT];

const NEXT_ROUND_DELAY_MS = 1000;

interface WatchViewProps {
	readonly session: DrillWatchSession;
	readonly onDeal: () => void;
	readonly onSpeed: (speed: number) => void;
	readonly words: DrillWords;
	readonly showNext: boolean;
	readonly lesson: Lesson;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

const WatchView = scope<WatchViewProps>(
	({ session, onDeal, onSpeed, words, showNext, lesson, view, onNavigate, context }) => {
		const { game, round, marks, overlays, narration, isDone, clears } = session;
		const pause = usePause(context);
		const { isPaused } = pause;

		useEffect(() => {
			if (!isDone || isPaused) return;

			const timeout = setTimeout(onDeal, NEXT_ROUND_DELAY_MS);

			return () => clearTimeout(timeout);
		}, [isDone, isPaused, round, onDeal]);

		return (
			<LessonShell
				lesson={lesson}
				view={view}
				onNavigate={onNavigate}
				context={context}
				pause={pause}
				hints={WATCH_HINTS}
				panel={
					<>
						<SpeedSlider steps={SPEED_STEPS} value={session.speed} onChange={onSpeed} />
						<LabelRow label={words.why} />
						<ol className="-mt-2 -mr-2 flex min-h-28 flex-1 flex-col gap-3 overflow-y-auto pr-2">
							{narration.map((line, index) => (
								<ListRow key={index} number={index + 1} detail={<PieceText text={line} />} />
							))}
						</ol>
						<IconButton label={words.next} className="shrink-0 self-end" onClick={onDeal}>
							<ArrowIcon size={22} />
						</IconButton>
					</>
				}
			>
				<PlayArea
					game={game}
					control={isDone ? "none" : "demo"}
					context={context}
					marks={marks}
					overlays={overlays}
					display={isDone ? "board" : "play"}
					pause={pause}
					showNext={showNext}
				>
					{clears > 0 && <SuccessFlash key={clears} />}
				</PlayArea>
			</LessonShell>
		);
	},
);

interface DrillWatchProps extends LessonScreenProps {
	readonly watch: DealWatch;
	readonly words: DrillWords;
	readonly showNext: boolean;
}

export function DrillWatch({ watch, words, showNext, lesson, view, onNavigate, context }: DrillWatchProps) {
	const { settings, search } = context;

	const [session] = useState(() => {
		const created = createMutableState<DrillWatchSession>(createDrillWatch());

		dealDrillWatch(created, watch, { player: playerOf(settings.config), search });

		return created;
	});

	const handleDeal = useCallback(
		() => dealDrillWatch(session, watch, { player: playerOf(settings.config), search }),
		[session, watch, settings, search],
	);

	const handleSpeed = useCallback((speed: number) => setDrillWatchSpeed(session, speed), [session]);

	return (
		<WatchView
			session={session}
			onDeal={handleDeal}
			onSpeed={handleSpeed}
			words={words}
			showNext={showNext}
			lesson={lesson}
			view={view}
			onNavigate={onNavigate}
			context={context}
		/>
	);
}
