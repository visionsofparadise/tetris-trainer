import { samePlacement, type Piece, type Placement } from "@tetris-trainer/game";
import type { Home, Opener } from "./Opener";

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
	| { readonly kind: "place"; readonly home: Home; readonly reason: string }
	| { readonly kind: "hold"; readonly reason: string };

export type Move = { readonly kind: "place"; readonly placement: Placement } | { readonly kind: "hold" };

export type Verdict =
	| { readonly ok: true; readonly next: PlanState }
	| { readonly ok: false; readonly problem: string; readonly best: Decision | null };

const name = (hand: Hand): string => (hand === NEXT_BAG ? "next bag's piece" : hand.toUpperCase());

const list = (pieces: ReadonlyArray<Piece>): string => {
	const names = pieces.map((piece) => `the ${name(piece)}`);

	return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;
};

const pieceCount = ({ homes }: Opener): number => new Set(homes.map(({ placement }) => placement.mino)).size;

const homesOf = ({ homes }: Opener, hand: Hand): Array<Home> =>
	homes.filter(({ placement }) => placement.mino === hand);

const missing = (home: Home, placed: ReadonlyArray<Piece>): Array<Piece> =>
	home.after.filter((piece) => !placed.includes(piece));

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

export const isComplete = (opener: Opener, { placed }: PlanState): boolean => placed.length === pieceCount(opener);

const readyHomes = (opener: Opener, { current, placed }: PlanState): Array<Home> =>
	current === NEXT_BAG || placed.includes(current)
		? []
		: homesOf(opener, current).filter((home) => missing(home, placed).length === 0);

const whyNotNow = (opener: Opener, { current, placed }: PlanState): string => {
	if (current === NEXT_BAG) return "this piece belongs to the next bag";

	const [closest] = homesOf(opener, current).sort(
		(first, second) => missing(first, placed).length - missing(second, placed).length,
	);
	const needs = closest === undefined ? [] : missing(closest, placed);

	if (needs.length === 0) return `placing the ${name(current)} now leaves no way to finish`;

	if (closest?.after.length === pieceCount(opener) - 1) return `the ${name(current)} goes in last`;

	return `the ${name(current)} needs ${list(needs)} placed first`;
};

const placeDecision = (home: Home): Decision => ({ kind: "place", home, reason: home.description });

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

	for (const home of readyHomes(opener, state)) {
		const rest = plan(opener, afterPlace(state, home.placement.mino), allowHold);

		if (rest) return [placeDecision(home), ...rest];
	}

	if (!allowHold || state.holdLocked) return null;

	const rest = plan(opener, afterHold(state), allowHold);

	return rest ? [holdDecision(opener, state), ...rest] : null;
};

const earlyPieces = (opener: Opener, order: ReadonlyArray<Piece>): Array<Piece> =>
	order.filter((piece, index) =>
		homesOf(opener, piece).every((home) => missing(home, order.slice(0, index)).length > 0),
	);

export const impossibleReason = (opener: Opener, order: ReadonlyArray<Piece>): string => {
	const early = list(earlyPieces(opener, order));

	return `${early.charAt(0).toUpperCase()}${early.slice(1)} come before the pieces they need, and hold can only keep one piece waiting at a time.`;
};

const mistake = (opener: Opener, state: PlanState, problem: string): Verdict => ({
	ok: false,
	problem,
	best: plan(opener, state)?.[0] ?? null,
});

const judgePlace = (opener: Opener, state: PlanState, placement: Placement): Verdict => {
	const { current, placed } = state;

	if (current === NEXT_BAG) return mistake(opener, state, "That piece belongs to the next bag.");

	const home = homesOf(opener, current).find((candidate) => samePlacement(candidate.placement, placement));

	if (home === undefined) return mistake(opener, state, `That isn't a home for the ${name(current)}.`);

	const needs = missing(home, placed);

	if (needs.length > 0) return mistake(opener, state, `The ${name(current)} needs ${list(needs)} placed first.`);

	const next = afterPlace(state, current);

	return plan(opener, next) ? { ok: true, next } : mistake(opener, state, "That leaves no way to finish.");
};

export const judge = (opener: Opener, state: PlanState, move: Move): Verdict => {
	if (plan(opener, state) === null)
		return {
			ok: false,
			problem: `This order can't build ${opener.name}. ${impossibleReason(opener, state.order)}`,
			best: null,
		};

	if (move.kind === "place") return judgePlace(opener, state, move.placement);

	const next = afterHold(state);

	return plan(opener, next) ? { ok: true, next } : mistake(opener, state, "Holding there leaves no way to finish.");
};
