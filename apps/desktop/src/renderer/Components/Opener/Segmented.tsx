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
		<div className="flex flex-col gap-1.5">
			<span className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</span>
			<div className="flex flex-wrap gap-1 rounded-md bg-panel p-1" role="group" aria-label={label}>
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
