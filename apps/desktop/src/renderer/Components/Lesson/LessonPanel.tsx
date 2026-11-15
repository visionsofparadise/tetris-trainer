import { lessonView } from "../../utils/lessonViews";
import { BackIcon } from "../UI/Icons";
import { SidePanel } from "../UI/SidePanel";
import type { Lesson } from "../../models/Lesson";
import type { View } from "../../models/View";
import type { ReactNode } from "react";

interface LessonPanelProps {
	readonly lesson: Lesson;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly children: ReactNode;
}

export function LessonPanel({ lesson, view, onNavigate, children }: LessonPanelProps) {
	return (
		<SidePanel title={lesson.title}>
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
				{lesson.sections.length > 1 && (
					<nav className="flex gap-0.5" aria-label={`${lesson.title} sections`}>
						{lesson.sections.map((section) => {
							const sectionView = lessonView(lesson, section);

							return (
								<button
									key={section.id}
									type="button"
									className="tab"
									aria-current={sectionView === view ? "page" : undefined}
									onClick={() => onNavigate(sectionView)}
								>
									{section.title}
								</button>
							);
						})}
					</nav>
				)}
			</div>
			{children}
		</SidePanel>
	);
}
