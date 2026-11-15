import type { SegmentedOption } from "../Components/UI/Segmented";
import type { Category, OrderFilter } from "../lessons/opener/orders";

export const ORDER_OPTIONS: ReadonlyArray<SegmentedOption<OrderFilter>> = [
	{ value: "no-hold", label: "No hold" },
	{ value: "hold", label: "With hold" },
	{ value: "mixed", label: "With impossible" },
];

export const CATEGORY_SHORT_LABELS: Record<Category, string> = {
	"no-hold": "No hold",
	hold: "Needs hold",
	impossible: "Impossible",
};
