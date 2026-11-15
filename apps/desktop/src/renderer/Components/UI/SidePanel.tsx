import { cn } from "../../utils/cn";
import { LabelRow } from "./LabelRow";
import type { Tone } from "../../models/Tone";
import type { ReactNode } from "react";

interface SidePanelProps {
	readonly label: string;
	readonly detail?: ReactNode;
	readonly tone?: Tone;
	readonly className?: string;
	readonly children: ReactNode;
}

export function SidePanel({ label, detail, tone = "muted", className, children }: SidePanelProps) {
	return (
		<aside className="relative w-[440px] shrink-0" aria-label={label}>
			<LabelRow label={label} detail={detail} tone={tone} className="absolute inset-x-0 bottom-full mb-2.5" />
			<div
				className={cn(
					"flex h-(--well-height) flex-col overflow-y-auto gap-[18px] bg-panel p-[22px] chamfer-tr-22",
					className,
				)}
			>
				{children}
			</div>
		</aside>
	);
}
