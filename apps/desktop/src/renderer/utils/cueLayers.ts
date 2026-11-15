import type { ClearTone, Cue } from "../models/Sound";

export type Envelope = "hit" | "beep";

interface LayerTiming {
	readonly at: number;
	readonly length: number;
	readonly level: number;
	readonly envelope: Envelope;
	readonly lowpass?: number;
}

interface ToneLayer extends LayerTiming {
	readonly kind: "tone";
	readonly wave: OscillatorType;
	readonly frequency: number;
}

interface NoiseLayer extends LayerTiming {
	readonly kind: "noise";
	readonly band: number;
	readonly q: number;
}

export type CueLayer = ToneLayer | NoiseLayer;

const SUCCESS_LEAD = 0.15;

const successBeep = (at: number): ToneLayer => ({
	kind: "tone",
	at: SUCCESS_LEAD + at,
	length: 0.06,
	level: 0.22,
	envelope: "beep",
	wave: "sine",
	frequency: 1000,
});

const CLEAR_BODY: ReadonlyArray<CueLayer> = [
	{ kind: "noise", at: 0, length: 0.07, level: 1, envelope: "hit", band: 500, q: 0.8 },
	{ kind: "tone", at: 0, length: 0.09, level: 0.5, envelope: "hit", wave: "sine", frequency: 70 },
];

export const MAX_STREAK = 8;

const TICK_BASE = 1500;
const TICK_STEP = 2 / 12;
const TICK_LEVEL = 0.1;
const TICK_LEVEL_STEP = 0.01;
const DIFFICULT_TICK_DELAY = 0.05;

const clearTick = (at: number, frequency: number, level: number): ToneLayer => ({
	kind: "tone",
	at,
	length: 0.035,
	level,
	envelope: "beep",
	wave: "sine",
	frequency,
});

export const clearLayers = ({ streak, isDifficult }: ClearTone): ReadonlyArray<CueLayer> => {
	const step = Math.min(Math.max(streak, 0), MAX_STREAK);
	const frequency = TICK_BASE * 2 ** (step * TICK_STEP);
	const level = TICK_LEVEL + step * TICK_LEVEL_STEP;

	return [
		...CLEAR_BODY,
		clearTick(0.02, frequency, level),
		...(isDifficult ? [clearTick(0.02 + DIFFICULT_TICK_DELAY, frequency, level)] : []),
	];
};

export const CUE_LAYERS: Record<Cue, ReadonlyArray<CueLayer>> = {
	place: [
		{ kind: "noise", at: 0, length: 0.018, level: 1, envelope: "hit", band: 900, q: 0.7, lowpass: 1600 },
		{ kind: "tone", at: 0, length: 0.04, level: 0.45, envelope: "hit", wave: "sine", frequency: 90 },
	],
	success: [successBeep(0), successBeep(0.11)],
	failure: [
		{ kind: "tone", at: 0, length: 0.34, level: 0.2, envelope: "beep", wave: "square", frequency: 140, lowpass: 900 },
	],
};
