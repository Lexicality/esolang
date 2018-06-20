var empty = function(this: HTMLElement) {
	while (this.firstChild) {
		// FIXME: Does this .remove() on the child? We don't want orphan nodes
		this.removeChild(this.firstChild);
	}
};

interface AugmentedHTMLElement extends HTMLElement {
	on<K extends keyof HTMLElementEventMap>(
		type: K,
		listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions,
	): void;
	on(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void;
	empty: (this: HTMLElement) => void;
}

export function $(selector: string): AugmentedHTMLElement | null {
	var el = document.querySelector(selector) as AugmentedHTMLElement | null;
	if (!el) {
		return el;
	}
	el.on = el.addEventListener;
	el.empty = empty;
	return el;
}

export function $$(selector: string) {
	return document.querySelectorAll(selector);
}

export function stdout(msg: string): void {
	$("#stdout")!.textContent += msg;
}

export function stdin(): string {
	var el = ($("#stdin") as any) as HTMLTextAreaElement;
	var value = el.value;
	if (!value.length) {
		return "";
	} else if (1 == value.length) {
		el.value = "";
		return value;
	}
	var ret = value.substr(0, 1);
	el.value = value.substr(1);
	return ret;
}
