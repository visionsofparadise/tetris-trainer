import { BOARD_COLUMNS, type Block } from "@tetris-trainer/game";
import { rowTop, type Layout } from "./gameLayout";
import type { BoardOverlay } from "../models/BoardOverlay";
import type { Tone } from "../models/Tone";

const FONT_RATIO = 0.36;
const MIN_FONT = 9;
const CHAR_RATIO = 0.62;
const BADGE_HEIGHT_RATIO = 1.25;
const BADGE_PADDING_RATIO = 0.6;
const BADGE_INSET = 2;
const ROW_LABEL_GAP = 3;

interface LabelBox {
	readonly left: number;
	readonly top: number;
	readonly width: number;
	readonly height: number;
}

interface OverlayLabel {
	readonly text: string;
	readonly tone: Tone;
	readonly x: number;
	readonly y: number;
	readonly anchor: { readonly x: number; readonly y: number };
	readonly fontSize: number;
	readonly badge: LabelBox | null;
}

type Corner = readonly [x: 0 | 1, y: 0 | 1];

const SLOTS: ReadonlyArray<Corner> = [
	[0, 0],
	[1, 1],
	[1, 0],
	[0, 1],
];

const labelCell = (cells: ReadonlyArray<Block>): Block | undefined => {
	const top = Math.max(...cells.map(([, y]) => y));

	return cells
		.filter(([, y]) => y === top)
		.reduce<Block | undefined>((left, cell) => (left && left[0] <= cell[0] ? left : cell), undefined);
};

const fontSizeOf = ({ cellSize }: Layout): number => Math.max(MIN_FONT, Math.round(cellSize * FONT_RATIO));

const badgeIn = ([x, y]: Block, [cornerX, cornerY]: Corner, text: string, layout: Layout): LabelBox => {
	const fontSize = fontSizeOf(layout);
	const width = text.length * fontSize * CHAR_RATIO + fontSize * BADGE_PADDING_RATIO;
	const height = fontSize * BADGE_HEIGHT_RATIO;
	const left = x * layout.cellSize;
	const top = rowTop(y, layout);
	const span = layout.cellSize - 2 * BADGE_INSET;

	return {
		left: left + BADGE_INSET + cornerX * (span - width),
		top: top + BADGE_INSET + cornerY * (span - height),
		width,
		height,
	};
};

export const overlayLabels = (overlays: ReadonlyArray<BoardOverlay>, layout: Layout): Array<OverlayLabel> => {
	const fontSize = fontSizeOf(layout);
	const used = new Map<string, number>();

	return overlays.flatMap((overlay): Array<OverlayLabel> => {
		if (overlay.kind === "tint") return [];

		if (overlay.kind === "rowLine")
			return [
				{
					text: overlay.label,
					tone: overlay.tone,
					x: BOARD_COLUMNS * layout.cellSize - ROW_LABEL_GAP,
					y: rowTop(overlay.row, layout) - ROW_LABEL_GAP,
					anchor: { x: 1, y: 1 },
					fontSize,
					badge: null,
				},
			];

		const cell = labelCell(overlay.cells);

		if (overlay.label === null || cell === undefined) return [];

		const key = `${cell[0]},${cell[1]}`;
		const slot = used.get(key) ?? 0;
		const badge = badgeIn(cell, SLOTS[slot % SLOTS.length] ?? [0, 0], overlay.label, layout);

		used.set(key, slot + 1);

		return [
			{
				text: overlay.label,
				tone: overlay.tone,
				x: badge.left + badge.width / 2,
				y: badge.top + badge.height / 2,
				anchor: { x: 0.5, y: 0.5 },
				fontSize,
				badge,
			},
		];
	});
};
