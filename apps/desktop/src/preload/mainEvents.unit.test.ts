import { beforeEach, describe, expect, it, vi } from "vitest";
import { mainEvents } from "./mainEvents";
import type { MainEventMap } from "../shared/models/MainEventMap";

const ipc = vi.hoisted(() => ({
	on: vi.fn<(channel: string, listener: (event: unknown, ...parameters: Array<unknown>) => void) => void>(),
	removeListener: vi.fn(),
}));

vi.mock("electron", () => ({ ipcRenderer: ipc }));
vi.mock("../shared/mainEventChannels", () => ({ MAIN_EVENT_CHANNELS: ["changed"] }));

describe("main event bridge", () => {
	beforeEach(() => vi.clearAllMocks());

	it("strips the Electron event and removes the exact registered listener", () => {
		const listener = vi.fn();
		const unsubscribe = mainEvents.on("changed" as keyof MainEventMap, listener);
		const forward = ipc.on.mock.calls[0]?.[1];

		expect(forward).toBeDefined();
		forward?.({ sender: "native object" }, "payload");

		expect(listener).toHaveBeenCalledExactlyOnceWith("payload");

		unsubscribe();

		expect(ipc.removeListener).toHaveBeenCalledExactlyOnceWith("changed", forward);
	});

	it("rejects channels outside the registered event list", () => {
		expect(() => mainEvents.on("unregistered" as keyof MainEventMap, vi.fn())).toThrow("Unknown main event channel");
		expect(ipc.on).not.toHaveBeenCalled();
	});
});
