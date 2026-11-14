import type { SegmentedOption } from "../Components/Opener/Segmented";
import type { Category, OrderFilter } from "../lessons/opener/orders";

export const ORDER_OPTIONS: ReadonlyArray<SegmentedOption<OrderFilter>> = [
	{ value: "no-hold", label: "No hold" },
	{ value: "hold", label: "With hold" },
	{ value: "mixed", label: "Mixed" },
];

export const CATEGORY_LABELS: Record<Category, string> = {
	"no-hold": "Buildable without hold",
	hold: "Needs hold",
	impossible: "Can't be built",
};
