import { parseTetrioConfig, type Action } from "@tetris-trainer/game";
import { scope } from "opshot/react";
import { useState, type ChangeEvent } from "react";
import { handlingLines } from "../../utils/formatHandling";
import { keyLabel } from "../../utils/keyLabel";
import { StatRow } from "../Board/StatRow";
import { LabelRow } from "../UI/LabelRow";
import { SidePanel } from "../UI/SidePanel";
import type { AppContext } from "../../models/AppContext";

const ACTION_LABELS: ReadonlyArray<readonly [Action, string]> = [
	["moveLeft", "Left"],
	["moveRight", "Right"],
	["softDrop", "Soft drop"],
	["hardDrop", "Hard drop"],
	["rotateCCW", "Rotate CCW"],
	["rotateCW", "Rotate CW"],
	["rotate180", "Rotate 180"],
	["hold", "Hold"],
	["retry", "Retry"],
];

interface SettingsPanelProps {
	readonly onLoad: () => void;
	readonly context: AppContext;
}

export const SettingsPanel = scope<SettingsPanelProps>(({ onLoad, context }) => {
	const { settings } = context;
	const [error, setError] = useState<string | null>(null);
	const { controls, handling } = settings.config;

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
		<SidePanel title="Settings">
			<div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto">
				<section className="flex flex-col gap-4" aria-label="Config">
					<LabelRow label="Config" detail={settings.configName ?? "TETR.IO defaults"} />
					<p className="text-sm leading-snug text-muted">
						Load your TETR.IO config export (.ttc) to play with your own handling and keys.
					</p>
					<p className="text-sm text-pink" aria-live="polite">
						{error}
					</p>
				</section>
				<section className="flex flex-col gap-4" aria-label="Handling">
					<LabelRow label="Handling" detail={handlingLines(handling).join(" · ")} tone="muted" />
				</section>
				<section className="flex flex-col gap-4 bg-raised p-4" aria-label="Keys">
					<LabelRow label="Keys" />
					<dl className="grid grid-cols-2 gap-x-6 gap-y-2.5">
						{ACTION_LABELS.map(([action, label]) => (
							<StatRow
								key={action}
								label={label}
								value={controls.custom[action].map(keyLabel).join(" ") || "Unbound"}
							/>
						))}
					</dl>
				</section>
			</div>
			<label className="button-primary">
				Load TETR.IO config…
				<input className="sr-only" type="file" accept=".ttc,application/json" onChange={handleFile} />
			</label>
		</SidePanel>
	);
});
