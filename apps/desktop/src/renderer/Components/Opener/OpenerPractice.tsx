import { createMutableState } from "opshot";
import { scope } from "opshot/react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useContinueKey } from "../../hooks/useContinueKey";
import { useGameKeyboard } from "../../hooks/useGameKeyboard";
import {
	dealPractice,
	declareImpossible,
	initialPractice,
	restartOrder,
	retryMistake,
	setPracticeFilter,
	type PracticeSession,
} from "../../lessons/opener/practiceSession";
import { ORDER_OPTIONS } from "../../utils/orderOptions";
import { GameCanvas } from "../Play/GameCanvas";
import { Shell } from "../Shell";
import { BannerOverlay } from "./BannerOverlay";
import { Segmented } from "./Segmented";
import type { Opener } from "../../lessons/opener/Opener";
import type { OrderFilter } from "../../lessons/opener/orders";
import type { AppContext } from "../../models/AppContext";

const NEXT_ORDER_DELAY_MS = 1500;

const CONTINUE_HINTS: Record<PracticeSession["status"], string | undefined> = {
	playing: undefined,
	mistake: "Press Space or hard drop to retry from the mistake.",
	cleared: "Press Space or hard drop for the next order.",
};

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
	readonly navigation: ReactNode;
	readonly context: AppContext;
}

const PracticeView = scope<PracticeViewProps>(
	({ session, onDeal, onFilter, onRetry, onRestart, onImpossible, opener, navigation, context }) => {
		const { status, filter } = session;

		useEffect(() => {
			if (status !== "cleared") return;

			const timeout = setTimeout(onDeal, NEXT_ORDER_DELAY_MS);

			return () => clearTimeout(timeout);
		}, [status, onDeal]);

		const handleContinue = status === "mistake" ? onRetry : onDeal;

		useGameKeyboard(session.game, onRetry, context);
		useContinueKey(status !== "playing", handleContinue, context);

		return (
			<Shell
				navigation={navigation}
				controls={
					<>
						<h1 className="text-2xl font-bold">{opener.name}: Practice</h1>
						<Segmented label="Stage" options={ORDER_OPTIONS} value={filter} onChange={onFilter} />
						<p className="text-sm text-muted">{STAGE_TEXT[filter]}</p>
						<div className="flex flex-wrap gap-2">
							{status === "mistake" && (
								<button className="button" type="button" onClick={onRetry}>
									Retry from mistake
								</button>
							)}
							{(filter === "mixed" || filter === "impossible") && status === "playing" && (
								<button className="button" type="button" onClick={onImpossible}>
									Impossible
								</button>
							)}
							<button className="button-secondary" type="button" onClick={onRestart}>
								Restart order
							</button>
							<button className="button-secondary" type="button" onClick={onDeal}>
								New order
							</button>
						</div>
					</>
				}
			>
				<GameCanvas game={session.game} marks={session.marks} />
				{session.banner && <BannerOverlay banner={session.banner} hint={CONTINUE_HINTS[status]} />}
			</Shell>
		);
	},
);

interface OpenerPracticeProps {
	readonly opener: Opener;
	readonly navigation: ReactNode;
	readonly context: AppContext;
}

export function OpenerPractice({ opener, navigation, context }: OpenerPracticeProps) {
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

	const handleImpossible = useCallback(() => declareImpossible(session, opener), [session, opener]);

	return (
		<PracticeView
			session={session}
			onDeal={handleDeal}
			onFilter={handleFilter}
			onRetry={handleRetry}
			onRestart={handleRestart}
			onImpossible={handleImpossible}
			opener={opener}
			navigation={navigation}
			context={context}
		/>
	);
}
