import { AsyncMainIpc, type IpcHandlerDependencies } from "../models/AsyncMainIpc";

export class MinimizeWindowMainIpc extends AsyncMainIpc<[], void> {
	readonly action = "minimizeWindow";

	handler({ browserWindow }: IpcHandlerDependencies): void {
		browserWindow.minimize();
	}
}

export class ToggleMaximizeWindowMainIpc extends AsyncMainIpc<[], void> {
	readonly action = "toggleMaximizeWindow";

	handler({ browserWindow }: IpcHandlerDependencies): void {
		if (browserWindow.isMaximized()) browserWindow.unmaximize();
		else browserWindow.maximize();
	}
}

export class IsWindowMaximizedMainIpc extends AsyncMainIpc<[], boolean> {
	readonly action = "isWindowMaximized";

	handler({ browserWindow }: IpcHandlerDependencies): boolean {
		return browserWindow.isMaximized();
	}
}

export class CloseWindowMainIpc extends AsyncMainIpc<[], void> {
	readonly action = "closeWindow";

	handler({ browserWindow }: IpcHandlerDependencies): void {
		browserWindow.close();
	}
}
