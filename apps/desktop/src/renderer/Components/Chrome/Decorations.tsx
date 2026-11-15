import { CornerCross } from "../UI/Icons";

const CROSSES = ["top-[120px] left-12", "top-[120px] right-12", "bottom-[70px] left-12", "right-12 bottom-[70px]"];

export function Decorations() {
	return (
		<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
			{CROSSES.map((position) => (
				<span key={position} className={`absolute hidden min-[1400px]:block ${position}`}>
					<CornerCross />
				</span>
			))}
			<span className="caption absolute top-1/2 left-[14px] -translate-y-1/2 rotate-180 whitespace-nowrap [writing-mode:vertical-rl]">
				Rules · SRS+ · 7-bag · Hold on · Ghost on · 180 spins on
			</span>
		</div>
	);
}
