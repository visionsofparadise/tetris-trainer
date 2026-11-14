import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useGameKeyboard } from "../../hooks/useGameKeyboard";
import { startAttempt, startDemo, startPreview } from "../../lessons/sequenceLesson";
import { GameCanvas } from "../Play/GameCanvas";
import { Shell } from "../Shell";
import { LessonFeedback } from "./LessonFeedback";
import type { AttemptResult, SequenceLesson } from "../../lessons/sequenceLesson";
import type { AppContext } from "../../models/AppContext";

type Phase = "ready" | "demonstrating" | "demonstrated" | "attempting";

const STATUS: Record<Phase, string> = {
	ready: "Watch the demonstration, then attempt it yourself.",
	demonstrating: "Demonstrating…",
	demonstrated: "Demonstration finished. Attempt it yourself.",
	attempting: "Attempting. A wrong placement restarts the attempt.",
};

const RESTART_DELAY_MS = 1000;

interface LessonProps {
	readonly lesson: SequenceLesson;
	readonly navigation: ReactNode;
	readonly context: AppContext;
}

export function Lesson({ lesson, navigation, context }: LessonProps) {
	const { settings } = context;
	const [game, setGame] = useState(() => startPreview(lesson));
	const [phase, setPhase] = useState<Phase>("ready");
	const [result, setResult] = useState<AttemptResult | null>(null);

	const handleDemonstrate = useCallback(() => {
		setResult(null);
		setPhase("demonstrating");
		setGame(startDemo(lesson, () => setPhase("demonstrated")));
	}, [lesson]);

	const handleAttempt = useCallback(() => {
		setResult(null);
		setPhase("attempting");
		setGame(startAttempt(lesson, settings.config.handling, setResult));
	}, [lesson, settings]);

	useEffect(() => {
		if (result === null) return;

		const timeout = setTimeout(handleAttempt, RESTART_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [result, handleAttempt]);

	useGameKeyboard(game, handleAttempt, context);

	return (
		<Shell
			navigation={navigation}
			controls={
				<>
					<h1 className="text-2xl font-bold">{lesson.name}</h1>
					<p className="text-sm text-muted">{lesson.instructions}</p>
					<div className="flex gap-3">
						<button className="button-secondary" type="button" onClick={handleDemonstrate}>
							Demonstrate
						</button>
						<button className="button" type="button" onClick={handleAttempt}>
							Attempt
						</button>
					</div>
					<p className="text-sm" aria-live="polite">
						{STATUS[phase]}
					</p>
				</>
			}
		>
			<GameCanvas game={game} />
			{result !== null && <LessonFeedback result={result} />}
		</Shell>
	);
}
