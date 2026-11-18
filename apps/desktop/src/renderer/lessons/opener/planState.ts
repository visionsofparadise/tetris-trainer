import { NEXT_BAG, type PlanState } from "./Opener";
import type { Piece } from "@tetris-trainer/game";

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
