export function $<E extends Element = HTMLElement>(selector: string): E;
export function $<E extends Element = HTMLElement>(
	selector: string,
	noCheck: boolean,
): E | null;
export function $<E extends Element = HTMLElement>(
	selector: string,
	noCheck = false,
): E | null {
	let el = document.querySelector<E>(selector);
	if (el != null) {
		return el;
	} else if (noCheck == true) {
		return null; // This is the caller's problem
	}
	throw new Error(`Missing HTML element ${selector}!`);
}

export const $$ = document.querySelectorAll.bind(document);

export function stdout(msg: string): void {
	$("#stdout").textContent += msg;
}

export function stdin(): string {
	let el: HTMLTextAreaElement = $("#stdin");
	let value = el.value[0] || "";
	el.value = el.value.slice(1);
	return value;
}
