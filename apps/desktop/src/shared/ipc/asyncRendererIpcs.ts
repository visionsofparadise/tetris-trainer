import {
	CloseWindowRendererIpc,
	MinimizeWindowRendererIpc,
	ToggleMaximizeWindowRendererIpc,
} from "./windowRendererIpcs";
import type { IpcHandlerAction, IpcHandlerParameters, IpcHandlerReturn } from "../models/AsyncRendererIpc";

export const ASYNC_RENDERER_IPCS = [
	MinimizeWindowRendererIpc,
	ToggleMaximizeWindowRendererIpc,
	CloseWindowRendererIpc,
] as const;

export type AsyncIpcAction = IpcHandlerAction<InstanceType<(typeof ASYNC_RENDERER_IPCS)[number]>>;
export type AsyncIpcParameters<A extends AsyncIpcAction> = IpcHandlerParameters<
	Extract<InstanceType<(typeof ASYNC_RENDERER_IPCS)[number]>, { action: A }>
>;
export type AsyncIpcReturn<A extends AsyncIpcAction> = IpcHandlerReturn<
	Extract<InstanceType<(typeof ASYNC_RENDERER_IPCS)[number]>, { action: A }>
>;
