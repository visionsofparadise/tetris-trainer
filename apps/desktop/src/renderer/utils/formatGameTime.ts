const FRAMES_PER_SECOND = 60;

export const formatGameTime = (frames: number): string => {
	const totalSeconds = frames / FRAMES_PER_SECOND;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = (totalSeconds % 60).toFixed(2).padStart(5, "0");

	return `${minutes}:${seconds}`;
};
