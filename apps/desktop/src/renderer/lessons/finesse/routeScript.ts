import type { ScriptStep } from "@tetris-trainer/game";

const FIRST_WAIT = 24;

const KEY_WAIT = 12;

const DROP_WAIT = 18;

export const routeScript = (route: ReadonlyArray<ScriptStep>): Array<ScriptStep> => [
	...route.map((step, index) => ({ ...step, wait: index === 0 ? FIRST_WAIT : KEY_WAIT })),
	{ tap: "hardDrop", wait: route.length === 0 ? FIRST_WAIT + DROP_WAIT : DROP_WAIT },
];
