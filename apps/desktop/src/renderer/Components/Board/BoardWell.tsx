import { cn } from "../../utils/cn";
import { GameCanvas } from "./GameCanvas";
import type { BoardMark } from "../../models/BoardMark";
import type { Control } from "../../models/Control";
import type { GameDisplay } from "../../models/GameDisplay";
import type { Game } from "@tetris-trainer/game";
import type { ReactNode } from "react";

const BRACKETS = [
	"-top-2.5 -left-2.5 border-t-2 border-l-2",
	"-top-2.5 -right-2.5 border-t-2 border-r-2",
	"-bottom-2.5 -left-2.5 border-b-2 border-l-2",
	"-right-2.5 -bottom-2.5 border-r-2 border-b-2",
];

const CONTROL_BORDERS: Record<Control, string> = {
	user: "border-lime",
	demo: "border-blue",
	none: "border-text/35",
};

interface BoardWellProps {
	readonly game: Game;
	readonly control: Control;
	readonly marks?: ReadonlyArray<BoardMark>;
	readonly display?: GameDisplay;
	readonly isPaused?: boolean;
	readonly onGameOver?: () => void;
	readonly children?: ReactNode;
}

export function BoardWell({ game, control, marks, display, isPaused, onGameOver, children }: BoardWellProps) {
	return (
		<div className="relative bg-well p-1.5 shadow-[0_0_0_1px_rgb(255_255_255/6%)]">
			{BRACKETS.map((position) => (
				<span
					key={position}
					className={cn("absolute size-4 transition-colors duration-150", CONTROL_BORDERS[control], position)}
					aria-hidden="true"
				/>
			))}
			<div className="board-dots relative h-(--board-height) w-(--board-width)" data-anchor="board">
				<GameCanvas game={game} marks={marks} display={display} isPaused={isPaused} onGameOver={onGameOver} />
			</div>
			{children}
		</div>
	);
}
