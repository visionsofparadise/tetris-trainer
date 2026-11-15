import type { BannerTone } from "../models/Banner";
import type { Tone } from "../models/Tone";

export const BANNER_TONES: Record<BannerTone, Tone> = {
	success: "lime",
	mistake: "pink",
	info: "muted",
};
