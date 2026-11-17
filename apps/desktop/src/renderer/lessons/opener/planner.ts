import { samePlacement, type Piece, type Placement, type ScriptStep } from "@tetris-trainer/game";
import type { Position, Opener } from "./Opener";

const NEXT_BAG = "next-bag";

type Hand = Piece | typeof NEXT_BAG;

export interface PlanState {
	readonly order: ReadonlyArray<Piece>;
	readonly drawn: number;
	readonly current: Hand;
	readonly hold: Hand | null;
	readonly holdLocked: boolean;
	readonly placed: ReadonlyArray<Piece>;
}

export type Decision =
	| {
			readonly kind: "place";
			readonly position: Position;
			readonly reason: string;
			readonly keys?: ReadonlyArray<ScriptStep>;
	  }
	| { readonly kind: "hold"; readonly reason: string };

export type Move = { readonly kind: "place"; readonly placement: Placement } | { readonly kind: "hold" };

export type MistakeKind = "placement" | "order" | "dead-end" | "hold" | "next-bag" | "impossible";

export interface Mistake {
	readonly kind: MistakeKind;
	readonly detail?: string;
	readonly best: Decision | null;
}

export type Verdict = { readonly ok: true; readonly next: PlanState } | ({ readonly ok: false } & Mistake);

const name = (hand: Hand): string => (hand === NEXT_BAG ? "next bag's piece" : hand.toUpperCase());

const list = (pieces: ReadonlyArray<Piece>): string => {
	const names = pieces.map((piece) => `the ${name(piece)}`);

	return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;
};

const requiredPieces = ({ positions, optional }: Opener): Array<Piece> => [
	...new Set(positions.map(({ placement }) => placement.mino).filter((mino) => !optional.includes(mino))),
];

export const pieceCount = (opener: Opener): number => requiredPieces(opener).length;

export const placedCount = (opener: Opener, { placed }: PlanState): number =>
	requiredPieces(opener).filter((piece) => placed.includes(piece)).length;

const positionsOf = ({ positions }: Opener, hand: Hand): Array<Position> =>
	positions.filter(({ placement }) => placement.mino === hand);

const missing = (position: Position, placed: ReadonlyArray<Piece>): Array<Piece> =>
	position.after.filter((piece) => !placed.includes(piece));

const isOpen = (position: Position, placed: ReadonlyArray<Piece>): boolean =>
	!position.before?.some((piece) => placed.includes(piece));

const draw = ({ order, drawn }: PlanState): Pick<PlanState, "current" | "drawn"> => {
	const next = order[drawn];

	return next === undefined ? { current: NEXT_BAG, drawn } : { current: next, drawn: drawn + 1 };
};

export const startState = (order: ReadonlyArray<Piece>): PlanState => ({
	order,
	drawn: 1,
	current: order[0] ?? NEXT_BAG,
	hold: null,
	holdLocked: false,
	placed: [],
});

export const afterPlace = (state: PlanState, piece: Piece): PlanState => ({
	...state,
	...draw(state),
	placed: [...state.placed, piece],
	holdLocked: false,
});

export const afterHold = (state: PlanState): PlanState =>
	state.hold === null
		? { ...state, ...draw(state), hold: state.current, holdLocked: true }
		: { ...state, current: state.hold, hold: state.current, holdLocked: true };

export const isComplete = (opener: Opener, state: PlanState): boolean =>
	placedCount(opener, state) === pieceCount(opener);

const readyPositions = (opener: Opener, { current, placed }: PlanState): Array<Position> =>
	current === NEXT_BAG || placed.includes(current)
		? []
		: positionsOf(opener, current).filter(
				(position) => isOpen(position, placed) && missing(position, placed).length === 0,
			);

const whyNotNow = (opener: Opener, { current, placed }: PlanState): string => {
	if (current === NEXT_BAG) return "this piece belongs to the next bag";

	const [closest] = positionsOf(opener, current).sort(
		(first, second) => missing(first, placed).length - missing(second, placed).length,
	);
	const needs = closest === undefined ? [] : missing(closest, placed);

	if (needs.length === 0) return `placing the ${name(current)} now leaves no way to finish`;

	return `the ${name(current)} needs ${list(needs)} placed first`;
};

const placeDecision = (position: Position, placed: ReadonlyArray<Piece>): Decision => {
	const { tuck } = position;

	return tuck?.under.some((piece) => placed.includes(piece))
		? { kind: "place", position, reason: tuck.description, keys: tuck.keys }
		: { kind: "place", position, reason: position.description, keys: position.keys };
};

const holdDecision = (opener: Opener, state: PlanState): Decision => {
	const why = whyNotNow(opener, state);

	return {
		kind: "hold",
		reason:
			state.hold === null
				? `Hold the ${name(state.current)}: ${why}.`
				: `Swap the ${name(state.current)} into hold and take out the ${name(state.hold)}: ${why}.`,
	};
};

export const plan = (opener: Opener, state: PlanState, allowHold = true): Array<Decision> | null => {
	if (isComplete(opener, state)) return [];

	for (const position of readyPositions(opener, state)) {
		const rest = plan(opener, afterPlace(state, position.placement.mino), allowHold);

		if (rest) return [placeDecision(position, state.placed), ...rest];
	}

	if (!allowHold || state.holdLocked) return null;

	const rest = plan(opener, afterHold(state), allowHold);

	return rest ? [holdDecision(opener, state), ...rest] : null;
};

const earlyPieces = (opener: Opener, order: ReadonlyArray<Piece>): Array<Piece> =>
	order.filter((piece, index) =>
		positionsOf(opener, piece).every((position) => missing(position, order.slice(0, index)).length > 0),
	);

const capitalized = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

export const impossibleReason = (opener: Opener, order: ReadonlyArray<Piece>): string =>
	`${capitalized(list(earlyPieces(opener, order)))} come before the pieces they need, and hold can only keep one piece waiting at a time.`;

const earlyNote = (opener: Opener, order: ReadonlyArray<Piece>): string =>
	`${capitalized(list(earlyPieces(opener, order)))} come early.`;

const mistake = (opener: Opener, state: PlanState, kind: MistakeKind, detail?: string): Verdict => ({
	ok: false,
	kind,
	detail,
	best: plan(opener, state)?.[0] ?? null,
});

const judgePlace = (opener: Opener, state: PlanState, placement: Placement): Verdict => {
	const { current, placed } = state;

	if (current === NEXT_BAG) {
		const stand = { ...state, current: placement.mino };

		return readyPositions(opener, stand).length > 0
			? judgePlace(opener, stand, placement)
			: mistake(opener, state, "next-bag");
	}

	const position = positionsOf(opener, current).find((candidate) => samePlacement(candidate.placement, placement));

	if (position === undefined) return mistake(opener, state, "placement");

	const needs = missing(position, placed);

	if (needs.length > 0) return mistake(opener, state, "order", `Needs ${list(needs)} first.`);

	const next = afterPlace(state, current);

	return plan(opener, next) ? { ok: true, next } : mistake(opener, state, "dead-end");
};

export const judge = (opener: Opener, state: PlanState, move: Move): Verdict => {
	if (plan(opener, state) === null)
		return { ok: false, kind: "impossible", detail: earlyNote(opener, state.order), best: null };

	if (move.kind === "place") return judgePlace(opener, state, move.placement);

	const next = afterHold(state);

	return plan(opener, next) ? { ok: true, next } : mistake(opener, state, "hold");
};
