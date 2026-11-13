import { MainEvents } from "./MainEvents";

export const mainEvents = new MainEvents(window.main);

if (import.meta.hot) import.meta.hot.dispose(() => mainEvents.dispose());
