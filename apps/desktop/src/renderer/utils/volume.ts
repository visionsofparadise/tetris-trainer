const LINE_PIXELS = 40;
const PAGE_PIXELS = 800;
const PIXELS_PER_STEP = 100;
const STEP = 0.05;

export const DEFAULT_VOLUME = 0.5;

export const clampVolume = (volume: number): number =>
	Number.isFinite(volume) ? Math.round(Math.min(1, Math.max(0, volume)) * 100) / 100 : DEFAULT_VOLUME;

const DELTA_PIXELS = [1, LINE_PIXELS, PAGE_PIXELS];

export const wheelVolume = (volume: number, deltaY: number, deltaMode: number): number =>
	clampVolume(volume - ((deltaY * (DELTA_PIXELS[deltaMode] ?? 1)) / PIXELS_PER_STEP) * STEP);
