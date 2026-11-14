import type { Banner, BannerTone } from "../../models/Banner";

const TONE_CLASSES: Record<BannerTone, string> = {
	success: "border-green-500/60 bg-green-950/90 text-green-100",
	mistake: "border-red-500/60 bg-red-950/90 text-red-100",
	info: "border-accent/60 bg-panel/95 text-text",
};

interface BannerOverlayProps {
	readonly banner: Banner;
	readonly hint?: string;
}

export function BannerOverlay({ banner, hint }: BannerOverlayProps) {
	return (
		<div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center px-6" aria-live="polite">
			<div className={`max-w-xl rounded-lg border px-5 py-3 shadow-lg ${TONE_CLASSES[banner.tone]}`}>
				<p className="text-lg font-bold text-balance">{banner.title}</p>
				{banner.detail && <p className="mt-1 text-sm">{banner.detail}</p>}
				{hint && <p className="mt-2 text-xs opacity-70">{hint}</p>}
			</div>
		</div>
	);
}
