import { cn } from "../../utils/cn";
import { TONE_TEXT } from "../../utils/toneClasses";
import type { Tone } from "../../models/Tone";
import type { ReactNode } from "react";

interface LabelRowProps {
	readonly label: ReactNode;
	readonly detail?: ReactNode;
	readonly tone?: Tone;
	readonly className?: string;
}

export function LabelRow({ label, detail, tone = "lime", className }: LabelRowProps) {
	return (
		<div className={cn("flex h-4 items-center justify-between gap-3", className)}>
			<span className="label truncate">{label}</span>
			{detail !== undefined && <span className={cn("label shrink-0", TONE_TEXT[tone])}>{detail}</span>}
		</div>
	);
}
