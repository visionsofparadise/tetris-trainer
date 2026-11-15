const FRAMES_PER_SECOND = 60;

export const formatClock = (frames: number): string => {
	const totalSeconds = Math.floor(frames / FRAMES_PER_SECOND);

	return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
};
