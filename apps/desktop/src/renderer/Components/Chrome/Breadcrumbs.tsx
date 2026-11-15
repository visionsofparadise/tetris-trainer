import { viewCrumbs } from "../../utils/viewCrumbs";
import type { LessonGroup } from "../../models/Lesson";
import type { View } from "../../models/View";

interface BreadcrumbsProps {
	readonly lessons: ReadonlyArray<LessonGroup>;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
}

export function Breadcrumbs({ lessons, view, onNavigate }: BreadcrumbsProps) {
	const crumbs = viewCrumbs(lessons, view);

	return (
		<nav aria-label="Breadcrumbs">
			<ol className="flex items-center gap-2.5">
				{crumbs.map((crumb, index) => {
					const isLast = index === crumbs.length - 1;

					return (
						<li key={crumb.label} className="flex items-center gap-2.5">
							{isLast ? (
								<span className="label text-text" aria-current="page">
									{crumb.label}
								</span>
							) : (
								<>
									<button
										type="button"
										className="no-drag label cursor-pointer text-muted/70 transition-colors hover:text-lime"
										onClick={() => onNavigate(crumb.view)}
									>
										{crumb.label}
									</button>
									<span className="label text-muted/40" aria-hidden="true">
										/
									</span>
								</>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
