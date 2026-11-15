import { clearLayers, CUE_LAYERS, type CueLayer, type Envelope } from "./cueLayers";
import type { Settings } from "../models/Settings";
import type { Sound } from "../models/Sound";

const ATTACK = 0.003;
const RELEASE = 0.006;
const SILENT = 0.0001;
const NOISE_SECONDS = 1;

interface Output {
	readonly audio: AudioContext;
	readonly master: GainNode;
	readonly noise: AudioBuffer;
}

const openOutput = (): Output => {
	const audio = new AudioContext();
	const master = audio.createGain();
	const noise = audio.createBuffer(1, audio.sampleRate * NOISE_SECONDS, audio.sampleRate);
	const samples = noise.getChannelData(0);

	for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;

	master.connect(audio.destination);

	return { audio, master, noise };
};

const shape = (gain: AudioParam, envelope: Envelope, level: number, begin: number, end: number) => {
	gain.setValueAtTime(0, begin);
	gain.linearRampToValueAtTime(level, begin + ATTACK);

	if (envelope === "hit") gain.exponentialRampToValueAtTime(SILENT, end);
	else {
		gain.setValueAtTime(level, end - RELEASE);
		gain.linearRampToValueAtTime(0, end);
	}
};

const layerSource = ({ audio, noise }: Output, layer: CueLayer, begin: number, end: number): AudioNode => {
	if (layer.kind === "noise") {
		const source = new AudioBufferSourceNode(audio, { buffer: noise });
		const filter = new BiquadFilterNode(audio, { type: "bandpass", frequency: layer.band, Q: layer.q });

		source.start(begin, Math.random() * (NOISE_SECONDS / 2), end - begin);

		return source.connect(filter);
	}

	const oscillator = new OscillatorNode(audio, { type: layer.wave, frequency: layer.frequency });

	oscillator.start(begin);
	oscillator.stop(end);

	return oscillator;
};

const filtered = ({ audio }: Output, source: AudioNode, lowpass: number | undefined): AudioNode =>
	lowpass === undefined
		? source
		: source.connect(new BiquadFilterNode(audio, { type: "lowpass", frequency: lowpass }));

const playLayer = (output: Output, start: number, layer: CueLayer) => {
	const begin = start + layer.at;
	const end = begin + layer.length;
	const envelope = output.audio.createGain();

	shape(envelope.gain, layer.envelope, layer.level, begin, end);
	filtered(output, layerSource(output, layer, begin, end), layer.lowpass)
		.connect(envelope)
		.connect(output.master);
};

export const createSound = (settings: Pick<Settings, "volume">): Sound => {
	let output: Output | null = null;

	const playLayers = (layers: ReadonlyArray<CueLayer>) => {
		if (settings.volume <= 0) return;

		output ??= openOutput();

		if (output.audio.state === "suspended") void output.audio.resume();

		output.master.gain.value = settings.volume ** 2;

		const start = output.audio.currentTime;

		for (const layer of layers) playLayer(output, start, layer);
	};

	return {
		play: (cue) => playLayers(CUE_LAYERS[cue]),
		playClear: (clear) => playLayers(clearLayers(clear)),
	};
};
