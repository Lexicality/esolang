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

let stdinBuffer = "";
export function stdin(): string {
	while (!stdinBuffer) {
		let res = prompt("Please enter text for stdin");
		if (res === null) {
			throw new Error("no stdin");
		}
		stdinBuffer = res;
	}
	let value = stdinBuffer[0];
	stdinBuffer = stdinBuffer.slice(1);
	return value;
}

export function resetStdout(): void {
	$("#stdout").textContent = "";
}

export function resetStdin(): void {
	stdinBuffer = "";
}
