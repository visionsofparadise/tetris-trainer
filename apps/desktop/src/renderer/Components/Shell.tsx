import { useCellSize } from "../hooks/useCellSize";
import { stageVariables } from "../utils/stageLayout";
import { Decorations } from "./Chrome/Decorations";
import { Header } from "./Chrome/Header";
import { VolumeReadout } from "./Chrome/VolumeReadout";
import type { AppContext } from "../models/AppContext";
import type { View } from "../models/View";
import type { ReactNode } from "react";

const NO_HINTS: ReadonlyArray<string> = [];

interface ShellProps {
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
	readonly aside: ReactNode;
	readonly actions?: ReactNode;
	readonly hints?: ReadonlyArray<string>;
	readonly children: ReactNode;
}

export function Shell({ view, onNavigate, context, aside, actions, hints = NO_HINTS, children }: ShellProps) {
	const cell = useCellSize();

	return (
		<div className="backdrop relative isolate flex h-dvh flex-col overflow-hidden">
			<Decorations context={context} />
			<Header view={view} onNavigate={onNavigate} actions={actions} context={context} />
			<main className="flex min-h-0 flex-1 items-center justify-center px-8 pt-6 pb-12">
				<div className="flex items-start gap-[52px] pt-(--spawn-height)" style={stageVariables(cell)}>
					{children}
					{aside}
				</div>
			</main>
			<footer className="pointer-events-none absolute inset-x-8 bottom-[22px] flex justify-between">
				<span className="caption">{hints.join(" · ")}</span>
				<VolumeReadout context={context} />
			</footer>
		</div>
	);
}
