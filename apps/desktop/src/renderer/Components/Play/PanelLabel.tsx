import { useMemo } from "react";
import { HEADER_ROWS } from "../../utils/gameLayout";

const LABEL_COLOR = 0x000000;
const LABEL_FONT = "Arial Black, sans-serif";
const LABEL_HEIGHT_RATIO = 0.7;
const LABEL_PADDING_RATIO = 0.1;
const LABEL_ANCHOR = { x: 0, y: 0.5 };

interface PanelLabelProps {
	readonly text: string;
	readonly left: number;
	readonly top: number;
	readonly cellSize: number;
}

export function PanelLabel({ text, left, top, cellSize }: PanelLabelProps) {
	const style = useMemo(
		() => ({ fill: LABEL_COLOR, fontFamily: LABEL_FONT, fontSize: cellSize * LABEL_HEIGHT_RATIO }),
		[cellSize],
	);

	return (
		<pixiText
			text={text}
			style={style}
			anchor={LABEL_ANCHOR}
			x={left + cellSize * LABEL_PADDING_RATIO}
			y={top + (cellSize * HEADER_ROWS) / 2}
		/>
	);
}
