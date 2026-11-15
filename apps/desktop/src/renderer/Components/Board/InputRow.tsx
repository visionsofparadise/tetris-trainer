import { cn } from "../../utils/cn";
import { keyLabel } from "../../utils/keyLabel";
import type { Control } from "../../models/Control";
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

const CONTROL_STYLES: Record<Control, { readonly label: string; readonly text: string; readonly pressed: string }> = {
	user: { label: "Input", text: "text-lime", pressed: "bg-lime text-ink" },
	demo: { label: "Demo input", text: "text-blue", pressed: "bg-blue text-ink" },
	none: { label: "Input", text: "", pressed: "" },
};

interface InputRowProps {
	readonly control: Control;
	readonly pressed: ReadonlySet<GameKey>;
	readonly config: TetrioConfig;
}

export function InputRow({ control, pressed, config }: InputRowProps) {
	const { label, text, pressed: pressedStyle } = CONTROL_STYLES[control];

	return (
		<div
			className={cn(
				"grid grid-cols-[var(--side-width)_auto_var(--side-width)] items-center gap-[22px]",
				control === "none" && "invisible",
			)}
		>
			<span className={cn("label text-right", text)}>{label}</span>
			<ul className="flex min-w-(--well-width) justify-center gap-1.5" aria-label={label}>
				{INPUT_KEYS.map((key) => (
					<li
						key={key}
						className={cn(
							"label inline-flex h-[34px] min-w-[34px] items-center justify-center px-2 text-xs font-bold tracking-[0.04em]",
							pressed.has(key) ? pressedStyle : "bg-panel text-text",
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
