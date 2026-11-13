import type { BrowserWindow } from "electron";

export interface IpcHandlerDependencies {
	readonly browserWindow: BrowserWindow;
}

export abstract class AsyncMainIpc<P extends Array<unknown>, R> {
	abstract readonly action: string;
	abstract handler(...parameters: [...P, IpcHandlerDependencies]): R | Promise<R>;

	register(dependencies: IpcHandlerDependencies): void {
		dependencies.browserWindow.webContents.ipc.handle(this.action, (_event, ...parameters: Array<unknown>) =>
			this.handler(...(parameters as P), dependencies),
		);
	}
}
