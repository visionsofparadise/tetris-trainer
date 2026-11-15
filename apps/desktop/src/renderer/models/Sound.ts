export type Cue = "place" | "success" | "failure";

export interface ClearTone {
	readonly streak: number;
	readonly isDifficult: boolean;
}

export interface Sound {
	readonly play: (cue: Cue) => void;
	readonly playClear: (clear: ClearTone) => void;
}
