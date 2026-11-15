import { cn } from "../../utils/cn";
import { TONE_TEXT } from "../../utils/toneClasses";
import { PieceText } from "../Pieces/PieceText";
import type { Tone } from "../../models/Tone";
import type { ReactNode } from "react";

const TONE_SHADOWS: Record<Tone, string> = {
	lime: "shadow-[inset_0_3px_0_var(--color-lime),0_20px_40px_rgb(0_0_0/35%)]",
	pink: "shadow-[inset_0_3px_0_var(--color-pink),0_20px_40px_rgb(0_0_0/35%)]",
	muted: "shadow-[inset_0_3px_0_var(--color-text),0_20px_40px_rgb(0_0_0/35%)]",
};

interface BoardCardProps {
	readonly tone: Tone;
	readonly icon: ReactNode;
	readonly title: string;
	readonly detail?: string;
	readonly children?: ReactNode;
}

export function BoardCard({ tone, icon, title, detail, children }: BoardCardProps) {
	return (
		<div
			className={cn(
				"absolute inset-x-[22px] top-[38%] flex flex-col gap-2.5 bg-panel p-[18px] chamfer-14",
				TONE_SHADOWS[tone],
			)}
			role="status"
		>
			<span className={cn("flex items-start gap-2.5", TONE_TEXT[tone])}>
				<span className="shrink-0 pt-0.5">{icon}</span>
				<span className="heading text-lg leading-tight text-balance text-text">
					<PieceText text={title} />
				</span>
			</span>
			{detail && (
				<p className="text-sm leading-snug text-muted">
					<PieceText text={detail} />
				</p>
			)}
			{children}
		</div>
	);
}
