export function $<E extends Element = HTMLElement>(selector: string): E;
export function $<E extends Element = HTMLElement>(
	selector: string,
	noCheck: boolean,
): E | null;
export function $<E extends Element = HTMLElement>(
	selector: string,
	noCheck = false,
): E | null {
	var el = document.querySelector<E>(selector);
	if (!el && !noCheck) {
		throw new Error(`Missing HTML element ${selector}!`);
	}
	return el;
}

export function $$<E extends Element = HTMLElement>(selector: string) {
	return document.querySelectorAll<E>(selector);
}

export function stdout(msg: string): void {
	$("#stdout").textContent += msg;
}

export function stdin(): string {
	var el: HTMLTextAreaElement = $("#stdin");
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
