import type { AppContext } from "./AppContext";
import type { View } from "./View";
import type { ReactNode } from "react";

export interface LessonScreenProps {
	readonly lesson: Lesson;
	readonly view: View;
	readonly onNavigate: (view: View) => void;
	readonly context: AppContext;
}

export interface LessonSection {
	readonly id: string;
	readonly title: string;
	readonly render: (props: LessonScreenProps) => ReactNode;
}

export interface Lesson {
	readonly id: string;
	readonly title: string;
	readonly sections: ReadonlyArray<LessonSection>;
}

export interface LessonGroup {
	readonly title: string;
	readonly lessons: ReadonlyArray<Lesson>;
}
