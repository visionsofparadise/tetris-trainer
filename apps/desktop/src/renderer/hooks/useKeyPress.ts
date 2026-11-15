import { useEffect } from "react";

export const useKeyPress = (code: string, isActive: boolean, onPress: () => void): void => {
	useEffect(() => {
		if (!isActive) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.repeat || event.code !== code) return;

			event.preventDefault();
			onPress();
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [code, isActive, onPress]);
};
