import { AsyncRendererIpc } from "../models/AsyncRendererIpc";

export class MinimizeWindowRendererIpc extends AsyncRendererIpc<"minimizeWindow", [], void> {
	readonly action = "minimizeWindow";
}

export class ToggleMaximizeWindowRendererIpc extends AsyncRendererIpc<"toggleMaximizeWindow", [], void> {
	readonly action = "toggleMaximizeWindow";
}

export class IsWindowMaximizedRendererIpc extends AsyncRendererIpc<"isWindowMaximized", [], boolean> {
	readonly action = "isWindowMaximized";
}

export class CloseWindowRendererIpc extends AsyncRendererIpc<"closeWindow", [], void> {
	readonly action = "closeWindow";
}
