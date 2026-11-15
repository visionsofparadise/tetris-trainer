import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { cellsPoint, leaderTo, type Leader, type Point, type Rect } from "../../utils/noteGeometry";
import { PieceText } from "../Pieces/PieceText";
import type { BoardNote, NoteTarget } from "../../models/BoardNote";
import type { Tone } from "../../models/Tone";

const TONE_BORDER: Record<Tone, string> = {
	lime: "border-lime",
	pink: "border-pink",
	muted: "border-text",
};

const TONE_MARK: Record<Tone, string> = {
	lime: "stroke-lime fill-lime",
	pink: "stroke-pink fill-pink",
	muted: "stroke-text fill-text",
};

interface ToneLeader extends Leader {
	readonly tone: Tone;
}

const relativeTo =
	(origin: DOMRect) =>
	(element: Element): Rect => {
		const { left, top, right, bottom } = element.getBoundingClientRect();

		return {
			left: left - origin.left,
			top: top - origin.top,
			right: right - origin.left,
			bottom: bottom - origin.top,
		};
	};

const targetShape = (target: NoteTarget, area: Element, measure: (element: Element) => Rect): Point | Rect | null => {
	if (typeof target.at === "string") {
		const anchor = area.querySelector(`[data-anchor="${target.at}"]`);

		return anchor && measure(anchor);
	}

	const board = area.querySelector('[data-anchor="board"]');

	return board && target.at.length > 0 ? cellsPoint(target.at, measure(board)) : null;
};

interface BoardNotesProps {
	readonly notes: ReadonlyArray<BoardNote>;
}

export function BoardNotes({ notes }: BoardNotesProps) {
	const layerRef = useRef<HTMLDivElement>(null);
	const [leaders, setLeaders] = useState<ReadonlyArray<ToneLeader>>([]);

	useLayoutEffect(() => {
		const layer = layerRef.current;
		const area = layer?.closest("section");

		if (!layer || !area) return;

		const cards = [...layer.querySelectorAll("[data-note]")];

		const measureLeaders = () => {
			const measure = relativeTo(layer.getBoundingClientRect());

			setLeaders(
				notes.flatMap((note, index) => {
					const card = cards[index];

					if (!card) return [];

					const cardRect = measure(card);

					return note.targets.flatMap((target) => {
						const shape = targetShape(target, area, measure);

						return shape ? [{ ...leaderTo(cardRect, shape), tone: target.tone }] : [];
					});
				}),
			);
		};

		measureLeaders();

		const observer = new ResizeObserver(measureLeaders);

		observer.observe(layer);

		for (const card of cards) observer.observe(card);

		return () => observer.disconnect();
	}, [notes]);

	return (
		<div ref={layerRef} className="pointer-events-none absolute inset-0">
			<svg className="note-leaders absolute inset-0 size-full overflow-visible" aria-hidden="true">
				{leaders.map(({ start, end, tone }) => (
					<g key={`${start.x},${start.y},${end.x},${end.y}`} className={TONE_MARK[tone]}>
						<line x1={start.x} y1={start.y} x2={end.x} y2={end.y} strokeWidth={2} />
						<rect x={start.x - 3} y={start.y - 3} width={6} height={6} strokeWidth={0} />
						<circle cx={end.x} cy={end.y} r={5} className="stroke-ink" strokeWidth={2} />
					</g>
				))}
			</svg>
			<div className="absolute inset-x-3 top-[calc(6px+var(--cell)*2)] flex flex-col gap-3" aria-live="polite">
				{notes.map((note, index) => (
					<div
						key={index}
						className={cn(
							"note-card flex flex-col gap-1.5 border-l-[3px] bg-panel px-4 py-3.5 shadow-[0_16px_32px_rgb(0_0_0/40%)]",
							TONE_BORDER[note.tone],
						)}
						data-note
					>
						{note.title && <p className="heading text-lg leading-tight">{note.title}</p>}
						{note.text && (
							<p className="text-base leading-relaxed text-pretty">
								<PieceText text={note.text} />
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
