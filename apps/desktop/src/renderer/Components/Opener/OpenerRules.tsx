import { placementCells } from "@tetris-trainer/game";
import { useMemo, useState, type ReactNode } from "react";
import { loadBoard } from "../../lessons/opener/openerScript";
import { GameCanvas } from "../Play/GameCanvas";
import { Shell } from "../Shell";
import type { Opener } from "../../lessons/opener/Opener";
import type { BoardMark } from "../../models/BoardMark";

interface OpenerRulesProps {
	readonly opener: Opener;
	readonly navigation: ReactNode;
}

export function OpenerRules({ opener, navigation }: OpenerRulesProps) {
	const { slides } = opener;
	const [index, setIndex] = useState(0);
	const slide = slides[index] ?? slides[0];
	const game = useMemo(() => loadBoard(slide?.board ?? []), [slide]);
	const marks = useMemo(
		(): Array<BoardMark> =>
			(slide?.marks ?? []).map((placement) => ({ cells: placementCells(placement), tone: "target" })),
		[slide],
	);

	return (
		<Shell
			navigation={navigation}
			controls={
				<>
					<h1 className="text-2xl font-bold">{opener.name}: Rules</h1>
					<section className="flex flex-col gap-2" aria-live="polite">
						<h2 className="text-lg font-semibold">{slide?.title}</h2>
						<p className="text-sm">{slide?.text}</p>
					</section>
					<div className="flex items-center gap-3">
						<button
							className="button-secondary"
							type="button"
							disabled={index === 0}
							onClick={() => setIndex(index - 1)}
						>
							Previous
						</button>
						<button
							className="button"
							type="button"
							disabled={index === slides.length - 1}
							onClick={() => setIndex(index + 1)}
						>
							Next
						</button>
						<span className="text-sm text-muted tabular-nums">
							{index + 1} / {slides.length}
						</span>
					</div>
					<ol className="flex flex-col gap-0.5 text-sm">
						{slides.map(({ title }, slideIndex) => (
							<li key={title}>
								<button
									type="button"
									className="nav-item w-full"
									aria-current={slideIndex === index ? "step" : undefined}
									onClick={() => setIndex(slideIndex)}
								>
									{title}
								</button>
							</li>
						))}
					</ol>
				</>
			}
		>
			<GameCanvas game={game} marks={marks} display="board" />
		</Shell>
	);
}
