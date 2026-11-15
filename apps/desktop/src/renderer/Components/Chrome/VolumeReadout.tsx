import { useEffect, useState } from "react";
import { isInScrollable } from "../../utils/isInScrollable";
import { wheelVolume } from "../../utils/volume";
import { VolumeCaption } from "./VolumeCaption";
import type { AppContext } from "../../models/AppContext";

const PREVIEW_GAP_MS = 90;
const SHOWN_MS = 3000;

interface VolumeReadoutProps {
	readonly context: AppContext;
}

export function VolumeReadout({ context }: VolumeReadoutProps) {
	const { settings, sound } = context;
	const [isShown, setIsShown] = useState(false);

	useEffect(() => {
		let previewedAt = Number.NEGATIVE_INFINITY;
		let hideTimeout: ReturnType<typeof setTimeout> | undefined;

		const handleWheel = (event: WheelEvent) => {
			if (event.ctrlKey || event.deltaY === 0 || isInScrollable(event.target)) return;

			settings.volume = wheelVolume(settings.volume, event.deltaY, event.deltaMode);

			if (event.timeStamp - previewedAt > PREVIEW_GAP_MS) {
				previewedAt = event.timeStamp;
				sound.play("place");
			}

			setIsShown(true);
			clearTimeout(hideTimeout);
			hideTimeout = setTimeout(() => setIsShown(false), SHOWN_MS);
		};

		window.addEventListener("wheel", handleWheel, { passive: true });

		return () => {
			window.removeEventListener("wheel", handleWheel);
			clearTimeout(hideTimeout);
		};
	}, [settings, sound]);

	return <VolumeCaption context={context} isShown={isShown} />;
}
