import type { Player } from "./Drill";
import type { TetrioConfig } from "@tetris-trainer/game";

export const playerOf = ({ handling, controls }: TetrioConfig): Player => ({
	handling,
	allow180: controls.custom.rotate180.length > 0,
});
