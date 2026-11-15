import { PieceIcon } from "./PieceIcon";
import type { Mino } from "@tetris-trainer/game";

interface PieceGlyphProps {
	readonly mino: Mino;
}

export function PieceGlyph({ mino }: PieceGlyphProps) {
	return (
		<span
			role="img"
			aria-label={mino.toUpperCase()}
			className="mx-[0.12em] inline-block align-[-0.12em] text-[0.4em] leading-none"
		>
			<PieceIcon mino={mino} />
		</span>
	);
}
