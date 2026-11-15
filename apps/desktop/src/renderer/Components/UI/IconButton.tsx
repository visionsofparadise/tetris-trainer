import { cn } from "../../utils/cn";
import type { ComponentProps } from "react";

interface IconButtonProps extends ComponentProps<"button"> {
	readonly label: string;
}

export function IconButton({ label, className, ...props }: IconButtonProps) {
	return (
		<button
			type="button"
			className={cn("icon-button size-13 bg-raised enabled:hover:brightness-110", className)}
			aria-label={label}
			title={label}
			{...props}
		/>
	);
}

export function PrimaryIconButton({ className, ...props }: IconButtonProps) {
	return <IconButton className={cn("bg-lime text-ink", className)} {...props} />;
}
