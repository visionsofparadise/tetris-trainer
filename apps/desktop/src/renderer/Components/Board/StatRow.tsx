interface StatRowProps {
	readonly label: string;
	readonly value: string;
}

export function StatRow({ label, value }: StatRowProps) {
	return (
		<div className="flex flex-col gap-1">
			<dt className="caption">{label}</dt>
			<dd className="heading self-end text-[15px] whitespace-nowrap tabular-nums normal-case">{value}</dd>
		</div>
	);
}
