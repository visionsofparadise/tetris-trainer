import { formatSpeed } from "../../utils/formatSpeed";
import { StepSlider } from "../UI/StepSlider";

interface SpeedSliderProps {
	readonly steps: ReadonlyArray<number>;
	readonly value: number;
	readonly onChange: (speed: number) => void;
}

export function SpeedSlider({ steps, value, onChange }: SpeedSliderProps) {
	return <StepSlider label="Speed" steps={steps} value={value} format={formatSpeed} onChange={onChange} />;
}
