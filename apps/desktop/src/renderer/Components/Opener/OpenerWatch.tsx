import { createMutableState } from "opshot";
import { scope } from "opshot/react";
import { useCallback, useEffect, useState } from "react";
import { PAUSE_HINT, usePause } from "../../hooks/usePause";
import {
	dealWatch,
	initialWatch,
	setWatchFilter,
	setWatchSpeed,
	type WatchSession,
} from "../../lessons/opener/watchSession";
import { decisionMarks } from "../../utils/decisionMarks";
import { CATEGORY_SHORT_LABELS, ORDER_OPTIONS } from "../../utils/orderOptions";
import { PlayArea } from "../Board/PlayArea";
import { SuccessFlash } from "../Board/SuccessFlash";
import { PauseButton } from "../Chrome/PauseButton";
import { OrderGlyphs } from "../Pieces/OrderGlyphs";
import { PieceText } from "../Pieces/PieceText";
import { Shell } from "../Shell";
import { BannerCard } from "../UI/BannerCard";
import { IconButton } from "../UI/IconButton";
import { ArrowIcon } from "../UI/Icons";
import { LabelRow } from "../UI/LabelRow";
import { ListRow } from "../UI/ListRow";
import { Segmented } from "../UI/Segmented";
import { StepSlider } from "../UI/StepSlider";
import { LessonPanel } from "./LessonPanel";
import type { Opener } from "../../lessons/opener/Opener";
import type { AppContext } from "../../models/AppContext";
import type { View } from "../../models/View";

const SPEED_STEPS: ReadonlyArray<number> = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];

const WATCH_HINTS = [PAUSE_HINT];

const formatSpeed = (speed: number): string => `${speed}×`;

const IMPOSSIBLE_READ_DELAY_MS = 5000;

interface WatchViewProps {
	readonly session: WatchSession;
	readonly onDeal: () => void;
	readonly onFilter: (filter: WatchSession["filter"]) => void;
	readonly onSpeed: (speed: number) => void;
	readonly opener: Opener;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

const WatchView = scope<WatchViewProps>(({ session, onDeal, onFilter, onSpeed, opener, view, onNavigate, context }) => {
	const { isDone, round, category, decisions, index, banner, clears } = session;
	const current = decisions[index];

	useEffect(() => {
		if (!isDone) return;

		const timeout = setTimeout(onDeal, IMPOSSIBLE_READ_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [isDone, round, onDeal]);

	const pause = usePause(context);
	const marks = decisionMarks(current);

	return (
		<Shell
			view={view}
			onNavigate={onNavigate}
			context={context}
			actions={<PauseButton pause={pause} />}
			hints={WATCH_HINTS}
			aside={
				<LessonPanel opener={opener} view={view} onNavigate={onNavigate}>
					<div className="flex flex-col gap-4">
						<Segmented label="Orders" options={ORDER_OPTIONS} value={session.filter} onChange={onFilter} />
						<StepSlider
							label="Speed"
							steps={SPEED_STEPS}
							value={session.speed}
							format={formatSpeed}
							onChange={onSpeed}
						/>
					</div>
					<LabelRow
						label={`Order · ${CATEGORY_SHORT_LABELS[category]}`}
						detail={<OrderGlyphs order={session.order} />}
						tone={category === "impossible" ? "pink" : "lime"}
					/>
					<ol className="-mr-2 flex min-h-28 flex-1 flex-col gap-3 overflow-y-auto pr-2">
						{decisions.map((decision, decisionIndex) => (
							<ListRow
								key={`${decisionIndex}-${decision.reason}`}
								number={decisionIndex + 1}
								detail={<PieceText text={decision.reason} />}
								isCurrent={decisionIndex === index}
								className={decisionIndex > index ? "opacity-70" : undefined}
								status={
									decisionIndex < index
										? { text: "■", tone: "lime" }
										: decisionIndex === index
											? { text: "▶", tone: "lime" }
											: { text: "□", tone: "muted" }
								}
							/>
						))}
					</ol>
					<IconButton label="New order" className="shrink-0 self-end" onClick={onDeal}>
						<ArrowIcon size={22} />
					</IconButton>
				</LessonPanel>
			}
		>
			<PlayArea game={session.game} context={context} marks={marks} pause={pause} inputLabel="Demo input">
				{banner && <BannerCard banner={banner} />}
				{clears > 0 && <SuccessFlash key={clears} />}
			</PlayArea>
		</Shell>
	);
});

interface OpenerWatchProps {
	readonly opener: Opener;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

export function OpenerWatch({ opener, view, onNavigate, context }: OpenerWatchProps) {
	const [session] = useState(() => {
		const created = createMutableState<WatchSession>(initialWatch(opener));

		dealWatch(created, opener);

		return created;
	});

	const handleDeal = useCallback(() => dealWatch(session, opener), [session, opener]);

	const handleFilter = useCallback(
		(filter: WatchSession["filter"]) => setWatchFilter(session, opener, filter),
		[session, opener],
	);

	const handleSpeed = useCallback((speed: number) => setWatchSpeed(session, speed), [session]);

	return (
		<WatchView
			session={session}
			onDeal={handleDeal}
			onFilter={handleFilter}
			onSpeed={handleSpeed}
			opener={opener}
			view={view}
			onNavigate={onNavigate}
			context={context}
		/>
	);
}
