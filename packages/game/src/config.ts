import { z } from "zod";

const keysSchema = z.array(z.string());

const controlsSchema = z.object({
	moveLeft: keysSchema,
	moveRight: keysSchema,
	softDrop: keysSchema,
	hardDrop: keysSchema,
	rotateCCW: keysSchema,
	rotateCW: keysSchema,
	rotate180: keysSchema,
	hold: keysSchema,
	exit: keysSchema,
	retry: keysSchema,
});

const handlingSchema = z.object({
	// eslint-disable-next-line id-denylist -- TETR.IO names this field.
	arr: z.number(),
	das: z.number(),
	dcd: z.number(),
	sdf: z.number(),
	safelock: z.boolean(),
	cancel: z.boolean(),
	may20g: z.boolean(),
	irs: z.enum(["off", "hold", "tap"]),
	ihs: z.enum(["off", "hold", "tap"]),
});

const tetrioConfigSchema = z.object({
	controls: z.object({ custom: controlsSchema }),
	handling: handlingSchema,
});

export type TetrioConfig = z.infer<typeof tetrioConfigSchema>;

export type Handling = TetrioConfig["handling"];

export type Action = keyof TetrioConfig["controls"]["custom"];

export const DEFAULT_CONFIG: TetrioConfig = {
	controls: {
		custom: {
			moveLeft: ["ARROWLEFT"],
			moveRight: ["ARROWRIGHT"],
			softDrop: ["ARROWDOWN"],
			hardDrop: ["SPACE"],
			rotateCCW: ["KEYZ", "CONTROLLEFT"],
			rotateCW: ["KEYX", "ARROWUP"],
			rotate180: ["KEYA"],
			hold: ["KEYC", "SHIFTLEFT"],
			exit: ["ESCAPE"],
			retry: ["KEYR"],
		},
	},
	handling: {
		// eslint-disable-next-line id-denylist -- TETR.IO names this field.
		arr: 2,
		das: 10,
		dcd: 1,
		sdf: 6,
		safelock: true,
		cancel: false,
		may20g: true,
		irs: "tap",
		ihs: "tap",
	},
};

export const parseTetrioConfig = (text: string): TetrioConfig => tetrioConfigSchema.parse(JSON.parse(text));

export const findAction = (config: TetrioConfig, code: string): Action | undefined => {
	const key = code.toUpperCase();
	const bindings = Object.entries(config.controls.custom) as Array<[Action, Array<string>]>;

	return bindings.find(([, keys]) => keys.includes(key))?.[0];
};
