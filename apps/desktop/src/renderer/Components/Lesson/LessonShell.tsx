import { PauseButton } from "../Chrome/PauseButton";
import { Shell } from "../Shell";
import { LessonPanel } from "./LessonPanel";
import type { LessonScreenProps } from "../../models/Lesson";
import type { PauseControl } from "../../models/PauseControl";
import type { ReactNode } from "react";

interface LessonShellProps extends LessonScreenProps {
	readonly pause: PauseControl;
	readonly hints: ReadonlyArray<string>;
	readonly panel: ReactNode;
	readonly children: ReactNode;
}

export function LessonShell({ pause, hints, panel, lesson, view, onNavigate, children, context }: LessonShellProps) {
	return (
		<Shell
			view={view}
			onNavigate={onNavigate}
			context={context}
			actions={<PauseButton pause={pause} />}
			hints={hints}
			aside={
				<LessonPanel lesson={lesson} view={view} onNavigate={onNavigate}>
					{panel}
				</LessonPanel>
			}
		>
			{children}
		</Shell>
	);
}
