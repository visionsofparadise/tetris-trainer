import { fitAfter, searchQuadReady } from "@tetris-trainer/game";
import { expose } from "comlink";

const searches = { quadReady: searchQuadReady, fitAfter };

export type WorkerSearches = typeof searches;

expose(searches);
