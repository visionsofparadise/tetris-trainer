import type { CSSProperties } from "react";

interface StepSliderProps {
	readonly label: string;
	readonly steps: ReadonlyArray<number>;
	readonly value: number;
	readonly format: (value: number) => string;
	readonly onChange: (value: number) => void;
}

export function StepSlider({ label, steps, value, format, onChange }: StepSliderProps) {
	const text = format(value);
	const index = Math.max(0, steps.indexOf(value));
	const last = Math.max(1, steps.length - 1);
	const track = { "--fill": `${(index / last) * 100}%`, "--segments": last } as CSSProperties;

	return (
		<label className="flex items-center justify-between gap-4">
			<span className="caption">{label}</span>
			<span className="flex flex-1 items-center justify-end gap-3">
				<input
					type="range"
					className="step-slider max-w-52 flex-1"
					style={track}
					min={0}
					max={last}
					step={1}
					value={index}
					aria-valuetext={text}
					onChange={(event) => onChange(steps[Number(event.currentTarget.value)] ?? value)}
				/>
				<output className="label w-9 text-right text-lime tabular-nums">{text}</output>
			</span>
		</label>
	);
}
