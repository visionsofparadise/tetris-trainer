import type { AsyncIpcAction, AsyncIpcParameters, AsyncIpcReturn } from "../../shared/ipc/asyncRendererIpcs";
import type { MainEventMap } from "../../shared/models/MainEventMap";

export type Main = {
	[K in AsyncIpcAction]: (...parameters: AsyncIpcParameters<K>) => Promise<AsyncIpcReturn<K>>;
} & {
	readonly events: {
		on: <K extends keyof MainEventMap>(channel: K, listener: (...parameters: MainEventMap[K]) => void) => () => void;
	};
};

declare global {
	interface Window {
		main: Main;
	}
}
