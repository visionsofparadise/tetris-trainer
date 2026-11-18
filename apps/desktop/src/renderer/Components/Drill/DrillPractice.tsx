import { createMutableState } from "opshot";
import { scope } from "opshot/react";
import { useCallback, useMemo, useState } from "react";
import { useContinueKey } from "../../hooks/useContinueKey";
import { useCue } from "../../hooks/useCue";
import { useGameKeyboard } from "../../hooks/useGameKeyboard";
import { PAUSE_HINT, usePause } from "../../hooks/usePause";
import {
	continueDrill,
	createDrillSession,
	dealDrill,
	retryDrill,
	setStage,
	type DrillSession,
} from "../../lessons/drill/drillSession";
import { playerOf } from "../../lessons/drill/player";
import { drillMarks, drillNotes } from "../../utils/drillNotes";
import { keyLabel } from "../../utils/keyLabel";
import { retryHints } from "../../utils/retryHints";
import { BoardNotes } from "../Board/BoardNotes";
import { PlayArea } from "../Board/PlayArea";
import { SuccessFlash } from "../Board/SuccessFlash";
import { LessonShell } from "../Lesson/LessonShell";
import { PieceText } from "../Pieces/PieceText";
import { IconButton, PrimaryIconButton } from "../UI/IconButton";
import { ArrowIcon, CheckIcon, PreviousIcon, ReplayIcon } from "../UI/Icons";
import { LabelRow } from "../UI/LabelRow";
import { Segmented, type SegmentedOption } from "../UI/Segmented";
import type { Drill, DrillStage, JudgeContext } from "../../lessons/drill/Drill";
import type { AppContext } from "../../models/AppContext";
import type { BoardOverlay } from "../../models/BoardOverlay";
import type { Lesson, LessonScreenProps } from "../../models/Lesson";
import type { View } from "../../models/View";

const NO_OVERLAYS: ReadonlyArray<BoardOverlay> = [];

interface PracticeViewProps<S, T extends DrillStage> {
	readonly session: DrillSession<S, T>;
	readonly drill: Drill<S, T>;
	readonly showNext: boolean;
	readonly onRetry: () => void;
	readonly onContinue: () => void;
	readonly onStage: (id: string) => void;
	readonly lesson: Lesson;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

function PracticeView<S, T extends DrillStage>({
	session,
	drill,
	showNext,
	onRetry,
	onContinue,
	onStage,
	lesson,
	view,
	onNavigate,
	context,
}: PracticeViewProps<S, T>) {
	const { game, state, stage, status, mistake, clears, passed, owner, board } = session;
	const { config } = context.settings;
	const isMistake = status === "mistake";
	const isRestart = stage.onMistake === "restart";
	const progress = drill.progress(state);
	const pause = usePause(context);
	const { resume } = pause;

	const stageOptions = useMemo(
		(): ReadonlyArray<SegmentedOption<string>> => drill.stages.map(({ id, title }) => ({ value: id, label: title })),
		[drill],
	);

	const notes = useMemo(() => (mistake ? drillNotes(mistake, config) : null), [mistake, config]);
	const marks = useMemo(() => (mistake ? drillMarks(mistake) : drill.marks(state)), [mistake, drill, state]);
	const overlays = useMemo(
		() => (mistake ? (mistake.overlays ?? NO_OVERLAYS) : drill.overlays(state, board)),
		[mistake, drill, state, board],
	);

	const handleRetry = useCallback(() => {
		resume();
		onRetry();
	}, [resume, onRetry]);

	const handleContinue = useCallback(() => {
		resume();
		onContinue();
	}, [resume, onContinue]);

	const handleStage = useCallback(
		(id: string) => {
			resume();
			onStage(id);
		},
		[resume, onStage],
	);

	useGameKeyboard(game, handleRetry, context, pause.isPaused);
	useContinueKey(isMistake, handleContinue, context);
	useCue(context.sound, "success", clears);
	useCue(context.sound, "failure", isMistake);

	const isRestartMistake = isMistake && isRestart;
	const retryLabel = isRestart ? "Restart the run" : isMistake ? "Retry the piece" : "Restart the piece";

	const hints = useMemo(() => {
		const { hardDrop } = config.controls.custom;

		return [
			...(isMistake && !isRestart ? [`${keyLabel(hardDrop[0])} for the ${drill.words.next.toLowerCase()}`] : []),
			...retryHints(config, retryLabel.toLowerCase(), isRestartMistake ? hardDrop.slice(0, 1) : []),
			PAUSE_HINT,
		];
	}, [isMistake, isRestart, isRestartMistake, config, retryLabel, drill]);

	return (
		<LessonShell
			lesson={lesson}
			view={view}
			onNavigate={onNavigate}
			context={context}
			pause={pause}
			hints={hints}
			panel={
				<>
					<div className="flex flex-col gap-4">
						<Segmented label="Stage" options={stageOptions} value={stage.id} onChange={handleStage} />
						<p className="text-sm leading-snug text-muted">{stage.goal}</p>
					</div>
					<div className="flex flex-col gap-4">
						<LabelRow
							label={<PieceText text={progress.label} />}
							detail={progress.value}
							tone={isMistake ? "pink" : "lime"}
						/>
						{passed.includes(stage.id) && <LabelRow label="Stage passed" detail={<CheckIcon size={14} />} />}
					</div>
					{import.meta.env.DEV && (
						<output data-drill data-owner={owner} hidden>
							{drill.describe(state, playerOf(config))}
						</output>
					)}
					<div className="mt-auto flex justify-between gap-2">
						{isRestartMistake ? (
							<PrimaryIconButton label={retryLabel} className="ml-auto" onClick={handleRetry}>
								<ReplayIcon size={22} />
							</PrimaryIconButton>
						) : (
							<>
								<IconButton label={retryLabel} onClick={handleRetry}>
									{isMistake ? <PreviousIcon size={22} /> : <ReplayIcon size={22} />}
								</IconButton>
								{isMistake && (
									<PrimaryIconButton label={drill.words.next} onClick={handleContinue}>
										<ArrowIcon size={22} />
									</PrimaryIconButton>
								)}
							</>
						)}
					</div>
				</>
			}
		>
			<PlayArea
				game={game}
				control={isMistake ? "none" : owner}
				context={context}
				marks={marks}
				overlays={overlays}
				display={isMistake ? "board" : "play"}
				pause={pause}
				showNext={showNext}
			>
				{notes && <BoardNotes notes={notes} />}
				{clears > 0 && <SuccessFlash key={clears} />}
			</PlayArea>
		</LessonShell>
	);
}

const ScopedPracticeView = scope(PracticeView) as typeof PracticeView;

interface DrillPracticeProps<S, T extends DrillStage> extends LessonScreenProps {
	readonly drill: Drill<S, T>;
	readonly showNext: boolean;
}

export function DrillPractice<S, T extends DrillStage>({
	drill,
	showNext,
	lesson,
	view,
	onNavigate,
	context,
}: DrillPracticeProps<S, T>) {
	const { settings, search } = context;

	const judgeContext = useCallback(
		(): JudgeContext => ({ player: playerOf(settings.config), search }),
		[settings, search],
	);

	const [session] = useState(() => {
		const created = createMutableState<DrillSession<S, T>>(createDrillSession(drill));

		dealDrill(created, drill, judgeContext());

		return created;
	});

	const handleRetry = useCallback(() => retryDrill(session, drill, judgeContext()), [session, drill, judgeContext]);

	const handleContinue = useCallback(() => {
		if (session.status === "mistake") continueDrill(session, drill, judgeContext());
	}, [session, drill, judgeContext]);

	const handleStage = useCallback(
		(id: string) => {
			const stage = drill.stages.find((candidate) => candidate.id === id);

			if (stage) setStage(session, drill, judgeContext(), stage);
		},
		[session, drill, judgeContext],
	);

	return (
		<ScopedPracticeView
			session={session}
			drill={drill}
			showNext={showNext}
			onRetry={handleRetry}
			onContinue={handleContinue}
			onStage={handleStage}
			lesson={lesson}
			view={view}
			onNavigate={onNavigate}
			context={context}
		/>
	);
}
