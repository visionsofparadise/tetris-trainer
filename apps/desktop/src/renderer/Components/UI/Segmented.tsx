export interface SegmentedOption<T> {
	readonly value: T;
	readonly label: string;
}

interface SegmentedProps<T> {
	readonly label: string;
	readonly options: ReadonlyArray<SegmentedOption<T>>;
	readonly value: T;
	readonly onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({ label, options, value, onChange }: SegmentedProps<T>) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="caption">{label}</span>
			<div className="flex gap-0.5" role="group" aria-label={label}>
				{options.map((option) => (
					<button
						key={option.value}
						type="button"
						className="segment"
						aria-pressed={option.value === value}
						onClick={() => onChange(option.value)}
					>
						{option.label}
					</button>
				))}
			</div>
		</div>
	);
}
