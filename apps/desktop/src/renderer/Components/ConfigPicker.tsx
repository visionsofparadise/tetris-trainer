import { parseTetrioConfig } from "@tetris-trainer/game";
import { scope } from "opshot/react";
import { useState, type ChangeEvent } from "react";
import type { AppContext } from "../models/AppContext";

interface ConfigPickerProps {
	readonly onLoad: () => void;
	readonly context: AppContext;
}

export const ConfigPicker = scope<ConfigPickerProps>(({ onLoad, context }) => {
	const { settings } = context;
	const [error, setError] = useState<string | null>(null);
	const { das, arr: autoRepeatRate, sdf } = settings.config.handling;

	const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		const file = input.files?.[0];

		input.value = "";

		if (!file) return;

		try {
			settings.config = parseTetrioConfig(await file.text());
			settings.configName = file.name;
			setError(null);
			onLoad();
		} catch {
			setError(`${file.name} is not a TETR.IO config. Export one from TETR.IO's config menu and choose it here.`);
		}
	};

	return (
		<section className="flex flex-col items-start gap-3 text-sm">
			<p className="text-muted">
				Config: <span className="text-text">{settings.configName ?? "TETR.IO defaults"}</span>
			</p>
			<p className="text-muted tabular-nums">
				DAS {das}F · ARR {autoRepeatRate}F · SDF {sdf}×
			</p>
			<label className="button-secondary">
				Load TETR.IO config…
				<input className="sr-only" type="file" accept=".ttc,application/json" onChange={handleFile} />
			</label>
			<p className="text-red-400" aria-live="polite">
				{error}
			</p>
		</section>
	);
});
