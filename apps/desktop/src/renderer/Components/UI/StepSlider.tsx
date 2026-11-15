interface StepSliderProps {
	readonly label: string;
	readonly steps: ReadonlyArray<number>;
	readonly value: number;
	readonly format: (value: number) => string;
	readonly onChange: (value: number) => void;
}

export function StepSlider({ label, steps, value, format, onChange }: StepSliderProps) {
	const text = format(value);

	return (
		<label className="flex items-center justify-between gap-4">
			<span className="caption">{label}</span>
			<span className="flex flex-1 items-center justify-end gap-3">
				<input
					type="range"
					className="h-7 max-w-52 flex-1 cursor-pointer accent-lime"
					min={0}
					max={steps.length - 1}
					step={1}
					value={Math.max(0, steps.indexOf(value))}
					aria-valuetext={text}
					onChange={(event) => onChange(steps[Number(event.currentTarget.value)] ?? value)}
				/>
				<output className="label w-9 text-right text-lime tabular-nums">{text}</output>
			</span>
		</label>
	);
}
