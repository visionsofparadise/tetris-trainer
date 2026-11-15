export type Cue = "place" | "clear" | "success" | "failure";

export interface Sound {
	readonly play: (cue: Cue) => void;
}
