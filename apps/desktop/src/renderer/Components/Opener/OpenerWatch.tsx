import { placementCells } from "@tetris-trainer/game";
import { createMutableState } from "opshot";
import { scope } from "opshot/react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
	dealWatch,
	initialWatch,
	setWatchFilter,
	setWatchSpeed,
	type WatchSession,
} from "../../lessons/opener/watchSession";
import { CATEGORY_LABELS, ORDER_OPTIONS } from "../../utils/orderOptions";
import { GameCanvas } from "../Play/GameCanvas";
import { Shell } from "../Shell";
import { BannerOverlay } from "./BannerOverlay";
import { Segmented, type SegmentedOption } from "./Segmented";
import type { Opener } from "../../lessons/opener/Opener";
import type { OrderFilter } from "../../lessons/opener/orders";
import type { BoardMark } from "../../models/BoardMark";

const SPEED_OPTIONS: ReadonlyArray<SegmentedOption<number>> = [
	{ value: 0.5, label: "0.5×" },
	{ value: 1, label: "1×" },
	{ value: 2, label: "2×" },
];

const NO_MARKS: ReadonlyArray<BoardMark> = [];

const NEXT_ORDER_DELAY_MS = 2000;
const IMPOSSIBLE_READ_DELAY_MS = 5000;

interface WatchViewProps {
	readonly session: WatchSession;
	readonly onDeal: () => void;
	readonly onFilter: (filter: OrderFilter) => void;
	readonly onSpeed: (speed: number) => void;
	readonly opener: Opener;
	readonly navigation: ReactNode;
}

const WatchView = scope<WatchViewProps>(({ session, onDeal, onFilter, onSpeed, opener, navigation }) => {
	const { isDone, round, category } = session;
	const current = session.decisions[session.index];

	useEffect(() => {
		if (!isDone) return;

		const timeout = setTimeout(onDeal, category === "impossible" ? IMPOSSIBLE_READ_DELAY_MS : NEXT_ORDER_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [isDone, round, category, onDeal]);

	const marks: ReadonlyArray<BoardMark> =
		current?.kind === "place" ? [{ cells: placementCells(current.home.placement), tone: "target" }] : NO_MARKS;

	return (
		<Shell
			navigation={navigation}
			controls={
				<>
					<h1 className="text-2xl font-bold">{opener.name}: Watch</h1>
					<p className="text-sm text-muted">
						A first bag is dealt and played through, with the reason for each decision.
					</p>
					<Segmented label="Orders" options={ORDER_OPTIONS} value={session.filter} onChange={onFilter} />
					<Segmented label="Speed" options={SPEED_OPTIONS} value={session.speed} onChange={onSpeed} />
					<button className="button self-start" type="button" onClick={onDeal}>
						New order
					</button>
					<p className="text-sm">
						<span className="font-mono tracking-widest">{session.order.join(" ").toUpperCase()}</span>
						<span className="text-muted"> · {CATEGORY_LABELS[session.category]}</span>
					</p>
					<ol className="flex flex-col gap-1 text-sm">
						{session.decisions.map((decision, index) => (
							<li
								key={`${index}-${decision.reason}`}
								className={index === session.index ? "text-text" : "text-muted"}
								aria-current={index === session.index ? "step" : undefined}
							>
								{index + 1}. {decision.reason}
							</li>
						))}
					</ol>
				</>
			}
		>
			<GameCanvas game={session.game} marks={marks} />
			{session.banner && <BannerOverlay banner={session.banner} />}
		</Shell>
	);
});

interface OpenerWatchProps {
	readonly opener: Opener;
	readonly navigation: ReactNode;
}

export function OpenerWatch({ opener, navigation }: OpenerWatchProps) {
	const [session] = useState(() => {
		const created = createMutableState<WatchSession>(initialWatch(opener));

		dealWatch(created, opener);

		return created;
	});

	const handleDeal = useCallback(() => dealWatch(session, opener), [session, opener]);

	const handleFilter = useCallback(
		(filter: OrderFilter) => setWatchFilter(session, opener, filter),
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
			navigation={navigation}
		/>
	);
}
