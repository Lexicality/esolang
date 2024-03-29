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
	let stdout = $<HTMLParagraphElement>("#stdout");
	stdout.textContent += msg;
	let wrapper = stdout.parentElement!;
	wrapper.scroll({
		top: wrapper.scrollHeight,
	});
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

export function requestNumber(): number {
	while (true) {
		let res = prompt("Please enter a number");
		if (res === null) {
			throw new Error("no numbers");
		}
		let number = parseInt(res, 10);
		if (!isNaN(number)) {
			return number;
		}
	}
}

export function resetStdout(): void {
	$("#stdout").textContent = "";
}

export function resetStdin(): void {
	stdinBuffer = "";
}
