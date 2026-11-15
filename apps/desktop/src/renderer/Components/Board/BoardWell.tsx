import { LabelRow } from "../UI/LabelRow";
import { GameCanvas } from "./GameCanvas";
import type { BoardMark } from "../../models/BoardMark";
import type { BoardStatus } from "../../models/BoardStatus";
import type { GameDisplay } from "../../models/GameDisplay";
import type { Game } from "@tetris-trainer/game";
import type { ReactNode } from "react";

const BRACKETS = [
	"-top-2.5 -left-2.5 border-t-2 border-l-2",
	"-top-2.5 -right-2.5 border-t-2 border-r-2",
	"-bottom-2.5 -left-2.5 border-b-2 border-l-2",
	"-right-2.5 -bottom-2.5 border-r-2 border-b-2",
];

interface BoardWellProps {
	readonly game: Game;
	readonly label: string;
	readonly status?: BoardStatus;
	readonly marks?: ReadonlyArray<BoardMark>;
	readonly display?: GameDisplay;
	readonly isPaused?: boolean;
	readonly onGameOver?: () => void;
	readonly children?: ReactNode;
}

export function BoardWell({ game, label, status, marks, display, isPaused, onGameOver, children }: BoardWellProps) {
	return (
		<div className="flex flex-col gap-3.5">
			<div className="relative bg-well p-1.5 shadow-[0_0_0_1px_rgb(255_255_255/6%)]">
				{BRACKETS.map((position) => (
					<span key={position} className={`absolute size-4 border-lime ${position}`} aria-hidden="true" />
				))}
				<div className="board-dots relative h-(--board-height) w-(--board-width)">
					<GameCanvas game={game} marks={marks} display={display} isPaused={isPaused} onGameOver={onGameOver} />
				</div>
				{children}
			</div>
			<LabelRow label={label} detail={status?.text} tone={status?.tone} />
		</div>
	);
}
