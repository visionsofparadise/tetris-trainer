import type { Main } from "./Main";
import type { MainEvents } from "./MainEvents";
import type { Settings } from "./Settings";
import type { Sound } from "./Sound";

export interface AppContext {
	readonly main: Main;
	readonly mainEvents: MainEvents;
	readonly settings: Settings;
	readonly sound: Sound;
}
