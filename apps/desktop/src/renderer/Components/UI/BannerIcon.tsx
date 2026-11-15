import { CheckIcon, CrossIcon, InfoIcon } from "./Icons";
import type { BannerTone } from "../../models/Banner";

interface BannerIconProps {
	readonly tone: BannerTone;
	readonly size: number;
}

export function BannerIcon({ tone, size }: BannerIconProps) {
	switch (tone) {
		case "success":
			return <CheckIcon size={size} />;
		case "mistake":
			return <CrossIcon size={size} />;
		case "info":
			return <InfoIcon size={size} />;
	}
}
