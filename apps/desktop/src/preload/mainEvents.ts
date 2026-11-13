import { ipcRenderer } from "electron";
import { MAIN_EVENT_CHANNELS } from "../shared/mainEventChannels";
import type { MainEventMap } from "../shared/models/MainEventMap";
import type { IpcRendererEvent } from "electron";

export const mainEvents = {
	on: <K extends keyof MainEventMap>(channel: K, listener: (...parameters: MainEventMap[K]) => void): (() => void) => {
		if (!MAIN_EVENT_CHANNELS.includes(channel)) throw new Error("Unknown main event channel");

		const forward = (_event: IpcRendererEvent, ...parameters: Array<unknown>) => {
			listener(...(parameters as MainEventMap[K]));
		};

		ipcRenderer.on(channel, forward);

		return () => {
			ipcRenderer.removeListener(channel, forward);
		};
	},
};
