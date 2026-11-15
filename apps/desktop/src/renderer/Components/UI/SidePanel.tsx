import { cn } from "../../utils/cn";
import { LabelRow } from "./LabelRow";
import { PanelTitle } from "./PanelTitle";
import type { ReactNode } from "react";

interface SidePanelProps {
	readonly title: string;
	readonly className?: string;
	readonly children: ReactNode;
}

export function SidePanel({ title, className, children }: SidePanelProps) {
	return (
		<aside className="relative w-[440px] shrink-0" aria-label={title}>
			<PanelTitle title={title} />
			<LabelRow label="Info" className="absolute inset-x-0 bottom-full mb-2.5" />
			<div
				className={cn(
					"flex h-(--well-height) flex-col gap-8 overflow-y-auto bg-panel p-[22px] chamfer-tr-22",
					className,
				)}
			>
				{children}
			</div>
		</aside>
	);
}
