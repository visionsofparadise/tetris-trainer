import { scope } from "opshot/react";
import { cn } from "../../utils/cn";
import { VIEW_TITLES } from "../../utils/viewTitles";
import { LogoMark, SettingsIcon } from "../UI/Icons";
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

export const Header = scope<HeaderProps>(({ view, onNavigate, actions, context }) => {
	const { configName } = context.settings;
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
			<div className="pointer-events-none absolute inset-x-0 flex justify-center gap-7">
				<span className="label">{VIEW_TITLES[view]}</span>
				<span className="label text-muted">SRS+ · 7-bag</span>
				<span className={cn("label", configName ? "text-lime" : "text-muted")}>
					{configName ?? "TETR.IO default handling"}
				</span>
			</div>
			<div className="flex items-center gap-2">
				{actions}
				<button
					type="button"
					className="no-drag icon-button"
					aria-label="Settings"
					aria-pressed={isSettings}
					onClick={() => onNavigate(isSettings ? "free-play" : "settings")}
				>
					<SettingsIcon />
				</button>
				<WindowControls context={context} />
			</div>
		</header>
	);
});
