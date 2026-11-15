import { pieceTokens } from "../../utils/pieceTokens";
import { PieceGlyph } from "./PieceGlyph";

interface PieceTextProps {
	readonly text: string;
}

export function PieceText({ text }: PieceTextProps) {
	return pieceTokens(text).map((token, index) =>
		"mino" in token ? <PieceGlyph key={index} mino={token.mino} /> : token.text,
	);
}
