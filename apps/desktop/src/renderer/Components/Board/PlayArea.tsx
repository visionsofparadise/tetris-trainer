import { useGameInput } from "../../hooks/useGameInput";
import { useGameReadout } from "../../hooks/useGameReadout";
import { keyLabel } from "../../utils/keyLabel";
import { BoardWell } from "./BoardWell";
import { HoldColumn } from "./HoldColumn";
import { InputRow } from "./InputRow";
import { NextColumn } from "./NextColumn";
import { PausedCard } from "./PausedCard";
import type { AppContext } from "../../models/AppContext";
import type { BoardMark } from "../../models/BoardMark";
import type { Control } from "../../models/Control";
import type { GameDisplay } from "../../models/GameDisplay";
import type { PauseControl } from "../../models/PauseControl";
import type { Game, Mino } from "@tetris-trainer/game";
import type { ReactNode } from "react";

const NO_PIECES: ReadonlyArray<Mino> = [];

interface PlayAreaProps {
	readonly game: Game;
	readonly control?: Control;
	readonly context: AppContext;
	readonly marks?: ReadonlyArray<BoardMark>;
	readonly display?: GameDisplay;
	readonly pause?: PauseControl;
	readonly onGameOver?: () => void;
	readonly children?: ReactNode;
}

export function PlayArea({
	game,
	control = "none",
	context,
	marks,
	display = "play",
	pause,
	onGameOver,
	children,
}: PlayAreaProps) {
	const { config } = context.settings;
	const readout = useGameReadout(game);
	const pressed = useGameInput(game);
	const active = pause?.isPaused ? "none" : control;

	return (
		<section className="flex flex-col items-center gap-[18px]" aria-label="Play area">
			<div className="flex items-start gap-[22px]">
				<HoldColumn readout={readout} holdKey={keyLabel(config.controls.custom.hold[0])} />
				<BoardWell
					game={game}
					control={active}
					marks={marks}
					display={display}
					isPaused={pause?.isPaused}
					onGameOver={onGameOver}
				>
					{children}
					{pause?.isPaused && <PausedCard />}
				</BoardWell>
				<NextColumn
					next={display === "play" ? readout.next : NO_PIECES}
					height={readout.height}
					holes={readout.holes}
				/>
			</div>
			<InputRow control={active} pressed={pressed} config={config} />
		</section>
	);
}
