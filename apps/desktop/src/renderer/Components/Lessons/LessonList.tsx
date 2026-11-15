import { LESSON_GROUPS } from "../../utils/lessonCatalog";
import { LabelRow } from "../UI/LabelRow";
import { ListRowButton } from "../UI/ListRow";
import { SidePanel } from "../UI/SidePanel";
import type { View } from "../../models/View";

const GROUP_OFFSETS = LESSON_GROUPS.map((_, index) =>
	LESSON_GROUPS.slice(0, index).reduce((count, { lessons }) => count + lessons.length, 0),
);

interface LessonListProps {
	readonly onNavigate: (view: View) => void;
}

export function LessonList({ onNavigate }: LessonListProps) {
	return (
		<SidePanel title="Lessons" className="gap-0 p-0">
			<div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-[22px]">
				{LESSON_GROUPS.map(({ title, lessons }, groupIndex) => (
					<section key={title} className="flex flex-col gap-3" aria-label={title}>
						<LabelRow label={title} className="px-0.5" />
						<ol className="flex flex-col gap-3">
							{lessons.map((lesson, index) => (
								<ListRowButton
									key={lesson.title}
									number={(GROUP_OFFSETS[groupIndex] ?? 0) + index + 1}
									title={lesson.title}
									detail={lesson.detail}
									onClick={() => {
										const [first] = lesson.sections;

										if (first) onNavigate(first.view);
									}}
								/>
							))}
						</ol>
					</section>
				))}
			</div>
		</SidePanel>
	);
}
