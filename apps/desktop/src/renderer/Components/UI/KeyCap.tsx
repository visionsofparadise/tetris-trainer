import { cn } from "../../utils/cn";
import type { ComponentProps } from "react";

export function KeyCap({ className, ...props }: ComponentProps<"li">) {
	return (
		<li
			className={cn(
				"label inline-flex h-[34px] min-w-[34px] items-center justify-center px-2 text-xs font-bold tracking-[0.04em]",
				className,
			)}
			{...props}
		/>
	);
}
