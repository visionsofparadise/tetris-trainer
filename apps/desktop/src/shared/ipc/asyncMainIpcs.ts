import { ReadSettingsMainIpc, WriteSettingsMainIpc } from "./settingsMainIpcs";
import { CloseWindowMainIpc, MinimizeWindowMainIpc, ToggleMaximizeWindowMainIpc } from "./windowMainIpcs";
import type { IpcHandlerDependencies } from "../models/AsyncMainIpc";

export const ASYNC_MAIN_IPCS: ReadonlyArray<new () => { register: (dependencies: IpcHandlerDependencies) => void }> = [
	MinimizeWindowMainIpc,
	ToggleMaximizeWindowMainIpc,
	CloseWindowMainIpc,
	ReadSettingsMainIpc,
	WriteSettingsMainIpc,
];
