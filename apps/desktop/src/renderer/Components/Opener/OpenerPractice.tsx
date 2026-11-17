import { createMutableState } from "opshot";
import { scope } from "opshot/react";
import { useCallback, useMemo, useState } from "react";
import { useContinueKey } from "../../hooks/useContinueKey";
import { useCue } from "../../hooks/useCue";
import { useGameKeyboard } from "../../hooks/useGameKeyboard";
import { useKeyPress } from "../../hooks/useKeyPress";
import { PAUSE_HINT, usePause } from "../../hooks/usePause";
import { pieceCount, placedCount, plan } from "../../lessons/opener/planner";
import {
	dealPractice,
	declareImpossible,
	initialPractice,
	restartOrder,
	retryMistake,
	setPracticeFilter,
	type PracticeSession,
} from "../../lessons/opener/practiceSession";
import { decisionMarks, NO_MARKS } from "../../utils/decisionMarks";
import { keyLabel } from "../../utils/keyLabel";
import { mistakeMarks, mistakeNotes } from "../../utils/mistakeNotes";
import { ORDER_OPTIONS } from "../../utils/orderOptions";
import { retryHints } from "../../utils/retryHints";
import { BoardNotes } from "../Board/BoardNotes";
import { PlayArea } from "../Board/PlayArea";
import { SuccessFlash } from "../Board/SuccessFlash";
import { LessonShell } from "../Lesson/LessonShell";
import { IconButton, PrimaryIconButton } from "../UI/IconButton";
import { ArrowIcon, CrossIcon, PreviousIcon, ReplayIcon } from "../UI/Icons";
import { LabelRow } from "../UI/LabelRow";
import { ProgressSegments } from "../UI/ProgressSegments";
import { Segmented, type SegmentedOption } from "../UI/Segmented";
import type { Opener } from "../../lessons/opener/Opener";
import type { OrderFilter } from "../../lessons/opener/orders";
import type { AppContext } from "../../models/AppContext";
import type { Lesson, LessonScreenProps } from "../../models/Lesson";
import type { View } from "../../models/View";

const IMPOSSIBLE_CODE = "Backspace";

type Guide = "off" | "on";

const GUIDE_OPTIONS: ReadonlyArray<SegmentedOption<Guide>> = [
	{ value: "off", label: "Off" },
	{ value: "on", label: "On" },
];

const STAGE_TEXT: Record<OrderFilter, string> = {
	"no-hold": "Every order can be built by placing each piece as it comes.",
	hold: "Every order needs hold somewhere to be built.",
	mixed: "Some orders can't be built. Press Impossible before your first piece when you spot one.",
	impossible: "No order can be built. Press Impossible before your first piece.",
};

interface PracticeViewProps {
	readonly session: PracticeSession;
	readonly onDeal: () => void;
	readonly onFilter: (filter: OrderFilter) => void;
	readonly onRetry: () => void;
	readonly onRestart: () => void;
	readonly onImpossible: () => void;
	readonly opener: Opener;
	readonly lesson: Lesson;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

const PracticeView = scope<PracticeViewProps>(
	({ session, onDeal, onFilter, onRetry, onRestart, onImpossible, opener, lesson, view, onNavigate, context }) => {
		const { status, filter, mistake, clears } = session;
		const { config } = context.settings;
		const pieces = pieceCount(opener);
		const placed = placedCount(opener, session.state);
		const isMistake = status === "mistake";
		const canCallImpossible = status === "playing" && (filter === "mixed" || filter === "impossible");
		const pause = usePause(context);
		const { resume } = pause;
		const [guide, setGuide] = useState<Guide>("off");

		const guideMarks = useMemo(
			() => (guide === "on" && status === "playing" ? decisionMarks(plan(opener, session.state)?.[0]) : NO_MARKS),
			[guide, status, opener, session.state],
		);

		const handleDeal = useCallback(() => {
			resume();
			onDeal();
		}, [resume, onDeal]);

		const handleRestart = useCallback(() => {
			resume();
			onRestart();
		}, [resume, onRestart]);

		const handleRetry = useCallback(() => {
			resume();
			onRetry();
		}, [resume, onRetry]);

		const notes = useMemo(() => (mistake ? mistakeNotes(mistake) : null), [mistake]);
		const mistakeBoardMarks = useMemo(() => (mistake ? mistakeMarks(mistake) : null), [mistake]);

		useGameKeyboard(session.game, handleRetry, context, pause.isPaused);
		useContinueKey(isMistake, handleRetry, context);
		useKeyPress(IMPOSSIBLE_CODE, canCallImpossible && !pause.isPaused, onImpossible);
		useCue(context.sound, "success", clears);
		useCue(context.sound, "failure", isMistake);

		return (
			<LessonShell
				lesson={lesson}
				view={view}
				onNavigate={onNavigate}
				context={context}
				pause={pause}
				hints={[
					...(isMistake ? [`${keyLabel(config.controls.custom.hardDrop[0])} to retry`] : []),
					...(canCallImpossible ? [`${keyLabel(IMPOSSIBLE_CODE)} to call impossible`] : []),
					...retryHints(config, "restart the order"),
					PAUSE_HINT,
				]}
				panel={
					<>
						<div className="flex flex-col gap-4">
							<Segmented label="Stage" options={ORDER_OPTIONS} value={filter} onChange={onFilter} />
							<p className="text-sm leading-snug text-muted">{STAGE_TEXT[filter]}</p>
							<Segmented label="Guide" options={GUIDE_OPTIONS} value={guide} onChange={setGuide} />
						</div>
						<div className="flex flex-col gap-4">
							<LabelRow label="Progress" detail={`${placed} / ${pieces}`} tone={isMistake ? "pink" : "lime"} />
							<ProgressSegments total={pieces} done={placed} label="Pieces placed" isFailed={isMistake} />
						</div>
						<div className="mt-auto flex justify-between gap-2">
							<div className="flex gap-2">
								<IconButton label="Restart the order" onClick={handleRestart}>
									<ReplayIcon size={22} />
								</IconButton>
								{isMistake && (
									<PrimaryIconButton label="Retry from the mistake" onClick={handleRetry}>
										<PreviousIcon size={22} />
									</PrimaryIconButton>
								)}
							</div>
							<div className="flex gap-2">
								{canCallImpossible && (
									<button className="button-primary" type="button" onClick={onImpossible}>
										<CrossIcon />
										Impossible
									</button>
								)}
								<IconButton label="New order" onClick={handleDeal}>
									<ArrowIcon size={22} />
								</IconButton>
							</div>
						</div>
					</>
				}
			>
				<PlayArea
					game={session.game}
					control={isMistake ? "none" : "user"}
					context={context}
					marks={mistakeBoardMarks ?? guideMarks}
					pause={pause}
				>
					{notes && <BoardNotes notes={notes} />}
					{clears > 0 && <SuccessFlash key={clears} />}
				</PlayArea>
			</LessonShell>
		);
	},
);

interface OpenerPracticeProps extends LessonScreenProps {
	readonly opener: Opener;
}

export function OpenerPractice({ opener, lesson, view, onNavigate, context }: OpenerPracticeProps) {
	const { settings } = context;

	const [session] = useState(() => {
		const created = createMutableState<PracticeSession>(initialPractice(opener, settings.config.handling));

		dealPractice(created, opener, settings.config.handling);

		return created;
	});

	const handleDeal = useCallback(
		() => dealPractice(session, opener, settings.config.handling),
		[session, opener, settings],
	);

	const handleFilter = useCallback(
		(filter: OrderFilter) => setPracticeFilter(session, opener, settings.config.handling, filter),
		[session, opener, settings],
	);

	const handleRetry = useCallback(() => {
		if (session.status === "mistake") retryMistake(session);
		else restartOrder(session);
	}, [session]);

	const handleRestart = useCallback(() => restartOrder(session), [session]);

	const handleImpossible = useCallback(
		() => declareImpossible(session, opener, settings.config.handling),
		[session, opener, settings],
	);

	return (
		<PracticeView
			session={session}
			onDeal={handleDeal}
			onFilter={handleFilter}
			onRetry={handleRetry}
			onRestart={handleRestart}
			onImpossible={handleImpossible}
			opener={opener}
			lesson={lesson}
			view={view}
			onNavigate={onNavigate}
			context={context}
		/>
	);
}
