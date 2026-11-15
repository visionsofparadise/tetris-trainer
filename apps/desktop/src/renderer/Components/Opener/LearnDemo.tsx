import { createMutableState } from "opshot";
import { scope } from "opshot/react";
import { useEffect, useState } from "react";
import { dealWatch, initialWatch, type WatchSession } from "../../lessons/opener/watchSession";
import { BoardNotes } from "../Board/BoardNotes";
import { PlayArea } from "../Board/PlayArea";
import type { Opener } from "../../lessons/opener/Opener";
import type { OrderPool } from "../../lessons/opener/orders";
import type { AppContext } from "../../models/AppContext";
import type { BoardNote } from "../../models/BoardNote";

const NEXT_ORDER_DELAY_MS = 1500;

const DEMO_POOL: OrderPool = "possible";

interface LearnDemoViewProps {
	readonly session: WatchSession;
	readonly opener: Opener;
	readonly notes: ReadonlyArray<BoardNote>;
	readonly context: AppContext;
}

const LearnDemoView = scope<LearnDemoViewProps>(({ session, opener, notes, context }) => {
	const { isDone, round } = session;

	useEffect(() => {
		if (!isDone) return;

		const timeout = setTimeout(() => dealWatch(session, opener, DEMO_POOL), NEXT_ORDER_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [isDone, round, session, opener]);

	return (
		<PlayArea game={session.game} context={context} inputLabel="Demo input">
			<BoardNotes notes={notes} />
		</PlayArea>
	);
});

interface LearnDemoProps {
	readonly opener: Opener;
	readonly notes: ReadonlyArray<BoardNote>;
	readonly context: AppContext;
}

export function LearnDemo({ opener, notes, context }: LearnDemoProps) {
	const [session] = useState(() => {
		const created = createMutableState<WatchSession>(initialWatch(opener));

		dealWatch(created, opener, DEMO_POOL);

		return created;
	});

	return <LearnDemoView session={session} opener={opener} notes={notes} context={context} />;
}
