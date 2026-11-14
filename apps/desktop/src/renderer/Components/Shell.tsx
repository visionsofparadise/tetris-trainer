import type { ReactNode } from "react";

interface ShellProps {
	readonly navigation: ReactNode;
	readonly controls: ReactNode;
	readonly children: ReactNode;
}

export function Shell({ navigation, controls, children }: ShellProps) {
	return (
		<main className="flex h-dvh">
			<section className="relative min-w-0 flex-1">{children}</section>
			<aside className="flex w-80 shrink-0 flex-col gap-8 overflow-y-auto border-l border-panel p-6">
				{navigation}
				<div className="flex flex-col gap-4">{controls}</div>
			</aside>
		</main>
	);
}
