import { PieceGlyph } from "./PieceGlyph";
import type { Piece } from "@tetris-trainer/game";

interface OrderGlyphsProps {
	readonly order: ReadonlyArray<Piece>;
}

export function OrderGlyphs({ order }: OrderGlyphsProps) {
	return (
		<span className="inline-flex items-center gap-1 text-[18px]">
			{order.map((piece, index) => (
				<PieceGlyph key={index} mino={piece} />
			))}
		</span>
	);
}
