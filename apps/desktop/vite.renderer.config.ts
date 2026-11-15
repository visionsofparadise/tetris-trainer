import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The workspace game package keeps one version across rebuilds, so a forced pre-bundle keeps its exports current.
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: { alias: { events: "events/" } },
	optimizeDeps: { force: true },
});
