import { useEffect, useState } from "react";
import type { AppContext } from "../models/AppContext";

export const useIsMaximized = ({ main, mainEvents }: AppContext): boolean => {
	const [isMaximized, setIsMaximized] = useState(false);

	useEffect(() => {
		let isCurrent = true;

		void main.isWindowMaximized().then((value) => {
			if (isCurrent) setIsMaximized(value);
		});
		mainEvents.on("maximizedChanged", setIsMaximized);

		return () => {
			isCurrent = false;
			mainEvents.off("maximizedChanged", setIsMaximized);
		};
	}, [main, mainEvents]);

	return isMaximized;
};
