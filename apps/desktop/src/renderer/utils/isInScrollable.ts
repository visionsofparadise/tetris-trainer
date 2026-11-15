const SCROLLING = new Set(["auto", "scroll"]);

export const isInScrollable = (target: EventTarget | null): boolean => {
	for (let element = target instanceof Element ? target : null; element; element = element.parentElement) {
		if (SCROLLING.has(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight)
			return true;
	}

	return false;
};
