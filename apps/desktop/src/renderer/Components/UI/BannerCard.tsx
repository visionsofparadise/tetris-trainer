import { BANNER_TONES } from "../../utils/bannerTone";
import { BannerIcon } from "./BannerIcon";
import { BoardCard } from "./BoardCard";
import type { Banner } from "../../models/Banner";

interface BannerCardProps {
	readonly banner: Banner;
}

export function BannerCard({ banner }: BannerCardProps) {
	return (
		<BoardCard
			tone={BANNER_TONES[banner.tone]}
			icon={<BannerIcon tone={banner.tone} size={20} />}
			title={banner.title}
			detail={banner.detail}
		/>
	);
}
