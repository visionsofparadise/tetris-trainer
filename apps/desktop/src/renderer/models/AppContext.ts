import type { LessonGroup } from "./Lesson";
import type { Main } from "./Main";
import type { MainEvents } from "./MainEvents";
import type { Settings } from "./Settings";
import type { Sound } from "./Sound";
import type { SearchClient } from "../search/SearchClient";

export interface AppContext {
	readonly main: Main;
	readonly mainEvents: MainEvents;
	readonly settings: Settings;
	readonly sound: Sound;
	readonly lessons: ReadonlyArray<LessonGroup>;
	readonly search: SearchClient;
}
