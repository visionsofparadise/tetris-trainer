import { AsyncRendererIpc } from "../models/AsyncRendererIpc";

export class ReadSettingsRendererIpc extends AsyncRendererIpc<"readSettings", [], string | null> {
	readonly action = "readSettings";
}

export class WriteSettingsRendererIpc extends AsyncRendererIpc<"writeSettings", [string], void> {
	readonly action = "writeSettings";
}
