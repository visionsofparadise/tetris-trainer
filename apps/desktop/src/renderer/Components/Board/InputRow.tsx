import { cn } from "../../utils/cn";
import { keyLabel } from "../../utils/keyLabel";
import type { GameKey, TetrioConfig } from "@tetris-trainer/game";

const INPUT_KEYS: ReadonlyArray<GameKey> = [
	"moveLeft",
	"moveRight",
	"softDrop",
	"hardDrop",
	"rotateCCW",
	"rotateCW",
	"rotate180",
	"hold",
];

interface InputRowProps {
	readonly label: string;
	readonly pressed: ReadonlySet<GameKey>;
	readonly config: TetrioConfig;
}

export function InputRow({ label, pressed, config }: InputRowProps) {
	return (
		<div className="grid grid-cols-[var(--side-width)_auto_var(--side-width)] items-center gap-[22px]">
			<span className="label text-right text-lime">{label}</span>
			<ul className="flex min-w-(--well-width) justify-center gap-1.5" aria-label={label}>
				{INPUT_KEYS.map((key) => (
					<li
						key={key}
						className={cn(
							"label inline-flex h-[34px] min-w-[34px] items-center justify-center px-2 text-xs font-bold tracking-[0.04em]",
							pressed.has(key) ? "bg-lime text-ink" : "bg-panel text-text",
						)}
					>
						{keyLabel(config.controls.custom[key][0])}
					</li>
				))}
			</ul>
			<span />
		</div>
	);
}
