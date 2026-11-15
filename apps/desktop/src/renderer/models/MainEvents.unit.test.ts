import { describe, expect, it, vi } from "vitest";
import { MainEvents } from "./MainEvents";
import type { Main } from "./Main";

vi.mock("../../shared/mainEventChannels", () => ({ MAIN_EVENT_CHANNELS: ["changed"] }));

describe("MainEvents", () => {
	it("keeps component subscription churn local and releases the bridge once", () => {
		let forward: ((...parameters: Array<unknown>) => void) | undefined;
		const unsubscribe = vi.fn();
		const subscribe = vi.fn();
		const main: Main = {
			minimizeWindow: vi.fn(),
			toggleMaximizeWindow: vi.fn(),
			closeWindow: vi.fn(),
			events: {
				on: (channel, listener) => {
					subscribe(channel);
					forward = (...parameters) => Reflect.apply(listener, undefined, parameters);
					return unsubscribe;
				},
			},
		};
		const events = new MainEvents(main);
		const listener = vi.fn();

		for (let iteration = 0; iteration < 50; iteration++) {
			events.on("changed", listener);
			events.off("changed", listener);
		}

		expect(subscribe).toHaveBeenCalledTimes(1);
		expect(events.listenerCount("changed")).toBe(0);
		expect(unsubscribe).not.toHaveBeenCalled();

		events.on("changed", listener);
		forward?.("payload");

		expect(listener).toHaveBeenCalledExactlyOnceWith("payload");

		events.dispose();
		events.dispose();
		forward?.("after disposal");

		expect(unsubscribe).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
