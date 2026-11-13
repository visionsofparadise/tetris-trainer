import { contextBridge, ipcRenderer } from "electron";
import { ASYNC_RENDERER_IPCS } from "../shared/ipc/asyncRendererIpcs";
import { mainEvents } from "./mainEvents";
import type { AsyncRendererIpc } from "../shared/models/AsyncRendererIpc";

const ipcConstructors: ReadonlyArray<new () => AsyncRendererIpc<string, Array<never>, unknown>> = ASYNC_RENDERER_IPCS;
const ipcHandlers = ipcConstructors.map((Ipc) => new Ipc().register(ipcRenderer));

contextBridge.exposeInMainWorld("main", { ...Object.fromEntries(ipcHandlers), events: mainEvents });
