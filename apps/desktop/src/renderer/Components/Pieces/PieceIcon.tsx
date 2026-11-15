import { piecePreview, type Mino } from "@tetris-trainer/game";
import { cssColor, exposedSides, insetRect, MINO_COLORS, shadeOf } from "../../utils/blockStyle";

const CELL = 14;
const EDGE = 1;

interface PieceIconProps {
	readonly mino: Mino;
}

export function PieceIcon({ mino }: PieceIconProps) {
	const { width, height, blocks } = piecePreview(mino);
	const color = MINO_COLORS[mino];
	const isMember = (column: number, row: number) => blocks.some(([x, y]) => x === column && y === row);

	return (
		<svg
			width={`${width}em`}
			height={`${height}em`}
			viewBox={`0 0 ${width * CELL} ${height * CELL}`}
			shapeRendering="crispEdges"
			aria-hidden="true"
		>
			{blocks.map(([x, y]) => {
				const inner = insetRect(x * CELL, y * CELL, CELL, exposedSides(x, y, isMember), EDGE);

				return (
					<g key={`${x},${y}`}>
						<rect x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={cssColor(shadeOf(color))} />
						<rect x={inner.x} y={inner.y} width={inner.width} height={inner.height} fill={cssColor(color)} />
					</g>
				);
			})}
		</svg>
	);
}
