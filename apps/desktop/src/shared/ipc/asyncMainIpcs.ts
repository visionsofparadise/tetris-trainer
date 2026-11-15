import { CloseWindowMainIpc, MinimizeWindowMainIpc, ToggleMaximizeWindowMainIpc } from "./windowMainIpcs";
import type { AsyncMainIpc } from "../models/AsyncMainIpc";

export const ASYNC_MAIN_IPCS: ReadonlyArray<new () => AsyncMainIpc<Array<never>, unknown>> = [
	MinimizeWindowMainIpc,
	ToggleMaximizeWindowMainIpc,
	CloseWindowMainIpc,
];
