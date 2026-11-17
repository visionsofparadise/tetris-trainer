import { StepSlider } from "../UI/StepSlider";

const formatSpeed = (speed: number): string => `${speed}×`;

interface SpeedSliderProps {
	readonly steps: ReadonlyArray<number>;
	readonly value: number;
	readonly onChange: (speed: number) => void;
}

export function SpeedSlider({ steps, value, onChange }: SpeedSliderProps) {
	return <StepSlider label="Speed" steps={steps} value={value} format={formatSpeed} onChange={onChange} />;
}
