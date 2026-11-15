import { cn } from "../../utils/cn";
import { TONE_TEXT } from "../../utils/toneClasses";
import type { Tone } from "../../models/Tone";
import type { ReactNode } from "react";

interface RowStatus {
	readonly text: string;
	readonly tone: Tone;
}

interface ListRowContentProps {
	readonly number: number;
	readonly title?: ReactNode;
	readonly detail?: ReactNode;
	readonly status?: RowStatus;
}

function ListRowContent({ number, title, detail, status }: ListRowContentProps) {
	return (
		<>
			<span className="label w-[22px] shrink-0 self-start pt-0.5 text-[11px] text-lime tabular-nums">
				{String(number).padStart(2, "0")}
			</span>
			<span className="flex min-w-0 flex-1 flex-col gap-1">
				{title !== undefined && <span className="heading text-sm">{title}</span>}
				{detail !== undefined && (
					<span className={cn("leading-snug", title === undefined ? "text-[15px]" : "text-sm text-muted")}>
						{detail}
					</span>
				)}
			</span>
			{status && (
				<span className={cn("caption shrink-0 self-start pt-1", TONE_TEXT[status.tone])}>{status.text}</span>
			)}
		</>
	);
}

interface ListRowProps extends ListRowContentProps {
	readonly isCurrent?: boolean;
	readonly className?: string;
}

const scrollIntoView = (node: HTMLLIElement | null): void =>
	node?.scrollIntoView({ block: "nearest", behavior: "smooth" });

export function ListRow({ isCurrent = false, className, ...content }: ListRowProps) {
	return (
		<li
			ref={isCurrent ? scrollIntoView : undefined}
			className={cn("list-row", className)}
			aria-current={isCurrent ? "step" : undefined}
		>
			<ListRowContent {...content} />
		</li>
	);
}

interface ListRowButtonProps extends ListRowContentProps {
	readonly isCurrent?: boolean;
	readonly onClick: () => void;
}

export function ListRowButton({ isCurrent = false, onClick, ...content }: ListRowButtonProps) {
	return (
		<li>
			<button type="button" className="list-row" aria-current={isCurrent ? "step" : undefined} onClick={onClick}>
				<ListRowContent {...content} />
			</button>
		</li>
	);
}
