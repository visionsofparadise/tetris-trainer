import { useEffect } from "react";
import type { Cue, Sound } from "../models/Sound";

export const useCue = (sound: Sound, cue: Cue, trigger: number | boolean) => {
	useEffect(() => {
		if (trigger !== false && trigger !== 0) sound.play(cue);
	}, [sound, cue, trigger]);
};
