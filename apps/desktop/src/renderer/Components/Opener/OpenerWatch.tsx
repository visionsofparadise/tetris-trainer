import { placementCells } from "@tetris-trainer/game";
import { createMutableState } from "opshot";
import { scope } from "opshot/react";
import { useCallback, useEffect, useState } from "react";
import { usePause } from "../../hooks/usePause";
import { DEMO_HANDLING } from "../../lessons/opener/openerScript";
import {
	dealWatch,
	initialWatch,
	setWatchFilter,
	setWatchSpeed,
	type WatchSession,
} from "../../lessons/opener/watchSession";
import { CATEGORY_SHORT_LABELS, ORDER_OPTIONS } from "../../utils/orderOptions";
import { PlayArea } from "../Board/PlayArea";
import { PauseButton } from "../Chrome/PauseButton";
import { OrderGlyphs } from "../Pieces/OrderGlyphs";
import { PieceText } from "../Pieces/PieceText";
import { Shell } from "../Shell";
import { BannerCard } from "../UI/BannerCard";
import { IconButton } from "../UI/IconButton";
import { ArrowIcon, PlayIcon } from "../UI/Icons";
import { LabelRow } from "../UI/LabelRow";
import { ListRow } from "../UI/ListRow";
import { ProgressSegments } from "../UI/ProgressSegments";
import { Segmented, type SegmentedOption } from "../UI/Segmented";
import { LessonPanel } from "./LessonPanel";
import type { Opener } from "../../lessons/opener/Opener";
import type { AppContext } from "../../models/AppContext";
import type { BoardMark } from "../../models/BoardMark";
import type { View } from "../../models/View";

const SPEED_OPTIONS: ReadonlyArray<SegmentedOption<number>> = [
	{ value: 0.5, label: "0.5×" },
	{ value: 1, label: "1×" },
	{ value: 2, label: "2×" },
];

const NO_MARKS: ReadonlyArray<BoardMark> = [];

const NEXT_ORDER_DELAY_MS = 2000;
const IMPOSSIBLE_READ_DELAY_MS = 5000;

const pad = (value: number): string => String(value).padStart(2, "0");

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
	const { isDone, round, category, decisions, index, banner } = session;
	const current = decisions[index];

	useEffect(() => {
		if (!isDone) return;

		const timeout = setTimeout(onDeal, category === "impossible" ? IMPOSSIBLE_READ_DELAY_MS : NEXT_ORDER_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [isDone, round, category, onDeal]);

	const pause = usePause(context);
	const marks: ReadonlyArray<BoardMark> =
		current?.kind === "place" ? [{ cells: placementCells(current.position.placement), tone: "target" }] : NO_MARKS;

	return (
		<Shell
			view={view}
			onNavigate={onNavigate}
			context={context}
			actions={<PauseButton pause={pause} />}
			hints={["Hatched: where the piece goes"]}
			aside={
				<LessonPanel opener={opener} view={view} onNavigate={onNavigate}>
					<div className="flex flex-col gap-2.5">
						<LabelRow
							label="Demonstration"
							detail={
								decisions.length > 0
									? `Move ${pad(Math.min(index + 1, decisions.length))} / ${pad(decisions.length)}`
									: undefined
							}
						/>
						<ProgressSegments total={Math.max(decisions.length, 1)} done={index} label="Moves played" />
						<Segmented label="Orders" options={ORDER_OPTIONS} value={session.filter} onChange={onFilter} />
						<Segmented label="Speed" options={SPEED_OPTIONS} value={session.speed} onChange={onSpeed} />
					</div>
					<LabelRow
						label="Order"
						detail={<OrderGlyphs order={session.order} />}
						tone={category === "impossible" ? "pink" : "lime"}
					/>
					<ol className="-mr-2 flex min-h-28 flex-1 flex-col gap-1.5 overflow-y-auto pr-2">
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
			<PlayArea
				game={session.game}
				handling={DEMO_HANDLING}
				context={context}
				marks={marks}
				pause={pause}
				status={{ text: CATEGORY_SHORT_LABELS[category], tone: category === "impossible" ? "pink" : "lime" }}
				inputLabel="Demo input"
			>
				<div className="absolute top-3.5 left-3.5 flex gap-1.5">
					<span className="label inline-flex h-6 items-center gap-1.5 bg-lime px-2 font-bold text-ink">
						<PlayIcon size={10} />
						Demo
					</span>
					<span className="label inline-flex h-6 items-center bg-panel px-2 font-bold">
						{session.speed}× speed
					</span>
				</div>
				{banner && <BannerCard banner={banner} />}
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
