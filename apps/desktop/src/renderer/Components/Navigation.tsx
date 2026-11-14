import { TKI_OPENER } from "../lessons/tkiOpener";
import type { View } from "../models/View";

interface NavigationItem {
	readonly view: View;
	readonly label: string;
}

interface NavigationSection {
	readonly title: string;
	readonly items: ReadonlyArray<NavigationItem>;
}

const SECTIONS: ReadonlyArray<NavigationSection> = [
	{ title: "Play", items: [{ view: "free-play", label: "Free play" }] },
	{ title: "Lessons", items: [{ view: "tki-opener", label: TKI_OPENER.name }] },
];

interface NavigationProps {
	readonly view: View;
	readonly onSelect: (view: View) => void;
}

export function Navigation({ view, onSelect }: NavigationProps) {
	return (
		<nav className="flex flex-col gap-4" aria-label="Main">
			{SECTIONS.map(({ title, items }) => (
				<section key={title} className="flex flex-col gap-1">
					<h2 className="text-xs font-semibold tracking-wider text-muted uppercase">{title}</h2>
					{items.map((item) => (
						<button
							key={item.view}
							type="button"
							className="nav-item"
							aria-current={item.view === view ? "page" : undefined}
							onClick={() => onSelect(item.view)}
						>
							{item.label}
						</button>
					))}
				</section>
			))}
		</nav>
	);
}
