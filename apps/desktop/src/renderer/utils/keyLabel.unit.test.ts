import { describe, expect, it } from "vitest";
import { keyLabel } from "./keyLabel";

describe("keyLabel", () => {
	it("names arrows, space and modifiers", () => {
		expect(keyLabel("ARROWLEFT")).toBe("←");
		expect(keyLabel("SPACE")).toBe("SPC");
		expect(keyLabel("SHIFTLEFT")).toBe("SHIFT");
	});

	it("strips key and digit prefixes", () => {
		expect(keyLabel("KEYZ")).toBe("Z");
		expect(keyLabel("DIGIT1")).toBe("1");
	});

	it("marks an unbound action", () => {
		expect(keyLabel(undefined)).toBe("—");
	});
});
