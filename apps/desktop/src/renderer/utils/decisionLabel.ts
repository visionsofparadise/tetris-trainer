import type { Decision } from "../lessons/opener/Opener";

export const decisionLabel = (decision: Decision): string =>
	decision.kind === "hold" ? "Hold" : `Place the ${decision.placement.mino.toUpperCase()}`;
