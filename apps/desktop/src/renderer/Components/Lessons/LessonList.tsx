import { lessonStart } from "../../utils/lessonViews";
import { LabelRow } from "../UI/LabelRow";
import { ListRowButton } from "../UI/ListRow";
import { SidePanel } from "../UI/SidePanel";
import type { AppContext } from "../../models/AppContext";
import type { View } from "../../models/View";

interface LessonListProps {
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

export function LessonList({ onNavigate, context }: LessonListProps) {
	const groups = context.lessons;
	const offsets = groups.map((_, index) =>
		groups.slice(0, index).reduce((count, { lessons }) => count + lessons.length, 0),
	);

	return (
		<SidePanel title="Lessons" className="gap-0 p-0">
			<div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-[22px]">
				{groups.map(({ title, lessons }, groupIndex) => (
					<section key={title} className="flex flex-col gap-3" aria-label={title}>
						<LabelRow label={title} className="px-0.5" />
						<ol className="flex flex-col gap-3">
							{lessons.map((lesson, index) => (
								<ListRowButton
									key={lesson.id}
									number={(offsets[groupIndex] ?? 0) + index + 1}
									title={lesson.title}
									detail={lesson.detail}
									onClick={() => onNavigate(lessonStart(lesson))}
								/>
							))}
						</ol>
					</section>
				))}
			</div>
		</SidePanel>
	);
}
