import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import { AsyncMainIpc } from "../models/AsyncMainIpc";

const SETTINGS_FILE = "settings.json";

const settingsPath = () => path.join(app.getPath("userData"), SETTINGS_FILE);

export class ReadSettingsMainIpc extends AsyncMainIpc<[], string | null> {
	readonly action = "readSettings";

	handler(): string | null {
		try {
			return readFileSync(settingsPath(), "utf8");
		} catch {
			return null;
		}
	}
}

export class WriteSettingsMainIpc extends AsyncMainIpc<[string], void> {
	readonly action = "writeSettings";

	handler(text: string): void {
		writeFileSync(settingsPath(), text);
	}
}
