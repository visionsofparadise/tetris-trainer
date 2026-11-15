interface StatRowProps {
	readonly label: string;
	readonly value: string;
}

export function StatRow({ label, value }: StatRowProps) {
	return (
		<div className="flex items-baseline justify-between whitespace-nowrap">
			<dt className="caption">{label}</dt>
			<dd className="heading text-[15px] tabular-nums normal-case">{value}</dd>
		</div>
	);
}
