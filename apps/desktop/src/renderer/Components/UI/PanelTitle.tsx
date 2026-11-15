interface PanelTitleProps {
	readonly title: string;
}

export function PanelTitle({ title }: PanelTitleProps) {
	return (
		<div
			className="panel-title-strip pointer-events-none absolute -top-8 -bottom-14 left-[calc(100%-10px)] -z-10 flex flex-col items-center gap-4"
			aria-hidden="true"
		>
			<div className="title-stripes h-14 w-full shrink-0" />
			<span className="display panel-title">{title}</span>
			<div className="title-stripes w-full flex-1" />
		</div>
	);
}
