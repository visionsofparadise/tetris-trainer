import { cn } from "../../utils/cn";

interface ProgressSegmentsProps {
	readonly total: number;
	readonly done: number;
	readonly label: string;
	readonly isFailed?: boolean;
}

export function ProgressSegments({ total, done, label, isFailed = false }: ProgressSegmentsProps) {
	return (
		<div
			className="flex gap-[3px]"
			role="progressbar"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={total}
			aria-valuenow={done}
		>
			{Array.from({ length: total }, (_, index) => (
				<span
					key={index}
					className={cn(
						"h-1.5 flex-1",
						index < done ? "bg-lime" : "bg-white/15",
						isFailed && index === done && "bg-pink",
					)}
				/>
			))}
		</div>
	);
}
