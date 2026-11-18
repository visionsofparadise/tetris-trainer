import type { Opener } from "./opener/Opener";

const notImplemented = (): never => {
	throw new Error("Not implemented");
};

export const TKI: Opener = {
	name: "TKI-3",
	pieceCount: notImplemented,
	placedCount: notImplemented,
	deal: notImplemented,
	plan: notImplemented,
	judge: notImplemented,
};
