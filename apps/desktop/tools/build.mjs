import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const { productName } = require("../package.json");
const options = { cwd: root, stdio: "inherit" };

execFileSync(process.execPath, [require.resolve("@electron-forge/cli/dist/electron-forge.js"), "package"], options);

if (process.platform === "win32") {
	execFileSync(
		process.execPath,
		[
			require.resolve("electron-builder/cli.js"),
			"--config",
			"electron-builder.yml",
			"--win",
			"nsis",
			`--${process.arch}`,
			"--prepackaged",
			path.join(root, "out", `${productName}-win32-${process.arch}`),
			"--publish",
			"never",
		],
		options,
	);
}
