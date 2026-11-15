import { TKI_SECTIONS } from "../../utils/lessonCatalog";
import { BackIcon } from "../UI/Icons";
import { SidePanel } from "../UI/SidePanel";
import type { Opener } from "../../lessons/opener/Opener";
import type { View } from "../../models/View";
import type { ReactNode } from "react";

interface LessonPanelProps {
	readonly opener: Opener;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly children: ReactNode;
}

export function LessonPanel({ opener, view, onNavigate, children }: LessonPanelProps) {
	return (
		<SidePanel title={opener.name}>
			<div className="flex items-center justify-between gap-3">
				<button
					type="button"
					className="icon-button -m-1.5 size-8 bg-raised chamfer-6 hover:brightness-110"
					aria-label="All lessons"
					title="All lessons"
					onClick={() => onNavigate("free-play")}
				>
					<BackIcon size={14} />
				</button>
				<nav className="flex gap-0.5" aria-label={`${opener.name} sections`}>
					{TKI_SECTIONS.map((section) => (
						<button
							key={section.view}
							type="button"
							className="tab"
							aria-current={section.view === view ? "page" : undefined}
							onClick={() => onNavigate(section.view)}
						>
							{section.title}
						</button>
					))}
				</nav>
			</div>
			{children}
		</SidePanel>
	);
}
