import { createMutableState } from "opshot";
import { scope } from "opshot/react";
import { useState } from "react";
import { dealWatch, initialWatch, type WatchSession } from "../../lessons/opener/watchSession";
import { BoardNotes } from "../Board/BoardNotes";
import { PlayArea } from "../Board/PlayArea";
import { SuccessFlash } from "../Board/SuccessFlash";
import type { Opener } from "../../lessons/opener/Opener";
import type { OrderPool } from "../../lessons/opener/orders";
import type { AppContext } from "../../models/AppContext";
import type { BoardNote } from "../../models/BoardNote";
import type { PauseControl } from "../../models/PauseControl";

const DEMO_POOL: OrderPool = "possible";

interface LearnDemoViewProps {
	readonly session: WatchSession;
	readonly notes: ReadonlyArray<BoardNote>;
	readonly pause: PauseControl;
	readonly context: AppContext;
}

const LearnDemoView = scope<LearnDemoViewProps>(({ session, notes, pause, context }) => (
	<PlayArea game={session.game} context={context} pause={pause} inputLabel="Demo input">
		<BoardNotes notes={notes} />
		{session.clears > 0 && <SuccessFlash key={session.clears} />}
	</PlayArea>
));

interface LearnDemoProps {
	readonly opener: Opener;
	readonly notes: ReadonlyArray<BoardNote>;
	readonly pause: PauseControl;
	readonly context: AppContext;
}

export function LearnDemo({ opener, notes, pause, context }: LearnDemoProps) {
	const [session] = useState(() => {
		const created = createMutableState<WatchSession>(initialWatch(opener));

		dealWatch(created, opener, DEMO_POOL);

		return created;
	});

	return <LearnDemoView session={session} notes={notes} pause={pause} context={context} />;
}
