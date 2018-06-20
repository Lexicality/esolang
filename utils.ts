export function $<E = HTMLElement>(selector: string): E {
	var el = document.querySelector(selector) as E | null;
	if (!el) {
		throw new Error(`Missing HTML element ${selector}!`);
	}
	return el;
}

export function $$(selector: string) {
	return document.querySelectorAll(selector);
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
