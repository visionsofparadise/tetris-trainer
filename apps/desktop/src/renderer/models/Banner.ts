export type BannerTone = "success" | "mistake" | "info";

export interface Banner {
	readonly tone: BannerTone;
	readonly title: string;
	readonly detail: string;
}
