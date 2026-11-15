import type { Handling } from "@tetris-trainer/game";

const INSTANT_SDF = 41;

const formatSdf = (sdf: number): string => (sdf >= INSTANT_SDF ? "∞" : `${sdf}×`);

export const handlingLines = ({ das, arr: autoRepeatRate, sdf }: Handling): ReadonlyArray<string> => [
	`DAS ${das}F`,
	`ARR ${autoRepeatRate}F`,
	`SDF ${formatSdf(sdf)}`,
];
