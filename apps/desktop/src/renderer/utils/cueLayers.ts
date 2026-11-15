import type { Cue } from "../models/Sound";

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

export const CUE_LAYERS: Record<Cue, ReadonlyArray<CueLayer>> = {
	place: [
		{ kind: "noise", at: 0, length: 0.018, level: 1, envelope: "hit", band: 900, q: 0.7, lowpass: 1600 },
		{ kind: "tone", at: 0, length: 0.04, level: 0.45, envelope: "hit", wave: "sine", frequency: 90 },
	],
	clear: [
		{ kind: "noise", at: 0, length: 0.07, level: 1, envelope: "hit", band: 500, q: 0.8 },
		{ kind: "tone", at: 0, length: 0.09, level: 0.5, envelope: "hit", wave: "sine", frequency: 70 },
		{ kind: "tone", at: 0.02, length: 0.035, level: 0.1, envelope: "beep", wave: "sine", frequency: 2000 },
	],
	success: [successBeep(0), successBeep(0.11)],
	failure: [
		{ kind: "tone", at: 0, length: 0.34, level: 0.2, envelope: "beep", wave: "square", frequency: 140, lowpass: 900 },
	],
};
