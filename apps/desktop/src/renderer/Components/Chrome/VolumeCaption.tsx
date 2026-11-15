import { scope } from "opshot/react";
import { cn } from "../../utils/cn";
import type { AppContext } from "../../models/AppContext";

interface VolumeCaptionProps {
	readonly context: AppContext;
	readonly isShown: boolean;
}

export const VolumeCaption = scope<VolumeCaptionProps>(({ context, isShown }) => {
	const percent = Math.round(context.settings.volume * 100);

	return (
		<span
			className={cn(
				"caption tabular-nums transition-opacity",
				isShown ? "opacity-100 duration-150" : "opacity-0 duration-700",
			)}
			aria-hidden={!isShown}
		>
			{percent === 0 ? "Volume muted" : `Volume ${percent}%`}
		</span>
	);
});
