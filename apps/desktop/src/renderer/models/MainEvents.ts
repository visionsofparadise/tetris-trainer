import { EventEmitter } from "events";
import { MAIN_EVENT_CHANNELS } from "../../shared/mainEventChannels";
import type { Main } from "./Main";
import type { MainEventMap } from "../../shared/models/MainEventMap";

export class MainEvents extends EventEmitter<MainEventMap> {
	readonly #unsubscribe: Array<() => void>;

	constructor(main: Main) {
		super();

		this.#unsubscribe = MAIN_EVENT_CHANNELS.map((channel) =>
			main.events.on(channel, (...parameters: Array<unknown>) => {
				Reflect.apply(this.emit, this, [channel, ...parameters]);
			}),
		);
	}

	dispose(): void {
		for (const unsubscribe of this.#unsubscribe.splice(0)) unsubscribe();

		this.removeAllListeners();
	}
}
