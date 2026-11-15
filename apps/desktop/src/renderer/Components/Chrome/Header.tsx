import { LogoMark, SettingsIcon } from "../UI/Icons";
import { Breadcrumbs } from "./Breadcrumbs";
import { WindowControls } from "./WindowControls";
import type { AppContext } from "../../models/AppContext";
import type { View } from "../../models/View";
import type { ReactNode } from "react";

interface HeaderProps {
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly actions?: ReactNode;
	readonly context: AppContext;
}

export function Header({ view, onNavigate, actions, context }: HeaderProps) {
	const isSettings = view === "settings";

	return (
		<header className="drag-region relative flex h-[72px] shrink-0 items-center justify-between px-8">
			<button
				type="button"
				className="no-drag flex cursor-pointer items-center gap-3.5 text-lime"
				aria-label="Free play"
				onClick={() => onNavigate("free-play")}
			>
				<LogoMark />
				<span className="display text-xl tracking-[0.01em] text-text">Trainer</span>
			</button>
			<div className="absolute left-1/2 -translate-x-1/2">
				<Breadcrumbs view={view} onNavigate={onNavigate} />
			</div>
			<div className="flex items-center gap-2">
				{actions}
				<button
					type="button"
					className="no-drag icon-button"
					aria-label="Settings"
					aria-pressed={isSettings}
					onClick={() => onNavigate("settings")}
				>
					<SettingsIcon />
				</button>
				<WindowControls context={context} />
			</div>
		</header>
	);
}
