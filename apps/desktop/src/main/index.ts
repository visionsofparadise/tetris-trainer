import path from "node:path";
import { app, BrowserWindow } from "electron";
import { ASYNC_MAIN_IPCS } from "../shared/ipc/asyncMainIpcs";
import type { MainEventMap } from "../shared/models/MainEventMap";

const createWindow = () => {
	const window = new BrowserWindow({
		width: 1440,
		height: 900,
		minWidth: 1100,
		minHeight: 720,
		frame: false,
		backgroundColor: "#5f6166",
		webPreferences: {
			preload: path.join(__dirname, "preload.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	for (const Ipc of ASYNC_MAIN_IPCS) new Ipc().register({ browserWindow: window });

	const sendMaximized = () =>
		window.webContents.send("maximizedChanged" satisfies keyof MainEventMap, window.isMaximized());

	window.on("maximize", sendMaximized);
	window.on("unmaximize", sendMaximized);

	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		void window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		void window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
	}
};

void app.whenReady().then(() => {
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
