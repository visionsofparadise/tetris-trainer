import { TKI } from "../lessons/tki";
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
	{
		title: TKI.name,
		items: [
			{ view: "tki-rules", label: "Rules" },
			{ view: "tki-watch", label: "Watch" },
			{ view: "tki-practice", label: "Practice" },
		],
	},
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
