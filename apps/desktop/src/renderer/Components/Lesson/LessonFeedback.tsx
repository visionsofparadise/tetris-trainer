import type { AttemptResult } from "../../lessons/sequenceLesson";

const FEEDBACK: Record<AttemptResult, { readonly text: string; readonly className: string }> = {
	success: { text: "Cleared", className: "bg-green-500/15 text-green-400" },
	fail: { text: "Wrong placement", className: "bg-red-500/15 text-red-400" },
};

interface LessonFeedbackProps {
	readonly result: AttemptResult;
}

export function LessonFeedback({ result }: LessonFeedbackProps) {
	const { text, className } = FEEDBACK[result];

	return (
		<div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}>
			<p className="text-5xl font-bold text-balance drop-shadow-lg">{text}</p>
		</div>
	);
}
