import { scope } from "opshot/react";
import { version } from "../../../../package.json";
import { handlingLines } from "../../utils/formatHandling";
import { CornerCross } from "../UI/Icons";
import type { AppContext } from "../../models/AppContext";

const CROSSES = ["top-[120px] left-12", "top-[120px] right-12", "bottom-[70px] left-12", "right-12 bottom-[70px]"];

interface DecorationsProps {
	readonly context: AppContext;
}

export const Decorations = scope<DecorationsProps>(({ context }) => {
	const { config, configName } = context.settings;
	const caption = [`v${version}`, configName ?? "TETR.IO defaults", ...handlingLines(config.handling)].join(" · ");

	return (
		<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
			{CROSSES.map((position) => (
				<span key={position} className={`absolute hidden min-[1400px]:block ${position}`}>
					<CornerCross />
				</span>
			))}
			<span className="caption absolute top-1/2 left-[14px] -translate-y-1/2 rotate-180 whitespace-nowrap [writing-mode:vertical-rl]">
				{caption}
			</span>
		</div>
	);
});
