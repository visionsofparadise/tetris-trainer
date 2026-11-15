export interface PauseControl {
	readonly isPaused: boolean;
	readonly toggle: () => void;
	readonly resume: () => void;
}
