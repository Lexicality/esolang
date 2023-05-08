import { $, $$ } from "./utils.js";
import { HighlightStack } from "./highlighter.js";

const MAX_RAM = 30000;
const INITIAL_DISPLAY = 5;
const DEFAULT_TEXT_VALUE = `0x00 '${String.fromCodePoint(0)}'`;

function hexify(num: number): string {
	if (num <= 0x0f) {
		return "0" + num.toString(16);
	}
	return num.toString(16);
}

export class RAMStack {
	private size: number;
	private _pointer: number = 0;
	private data: number[];
	private lastCreatedCell = -1;

	constructor(size = MAX_RAM) {
		this.size = size;
		this.data = new Array(this.size);
		$("#ram-headers").innerText = "";
		$("#ram-values").innerText = "";
		for (let i = 0; i < INITIAL_DISPLAY; i++) {
			this.createCell();
		}
		this.updateActive();
	}

	private createCell(): void {
		let cellNumber = this.lastCreatedCell + 1;
		this.lastCreatedCell += 1;

		let th = document.createElement("th", {});
		th.id = `ram-header-${cellNumber}`;
		th.classList.add("active", `ram-item-${cellNumber}`, "ram-header");
		th.textContent = cellNumber.toLocaleString();
		$("#ram-headers").appendChild(th);

		let td = document.createElement("td");
		td.id = `ram-cell-${cellNumber}`;
		td.classList.add("active", `ram-item-${cellNumber}`, "ram-cell");
		td.textContent = DEFAULT_TEXT_VALUE;
		$("#ram-values").appendChild(td);

		th.scrollIntoView({
			behavior: "smooth",
			inline: "nearest",
		});
	}

	private updateActive() {
		// We can work on the basis that we never move more than 1 ram item at a time here
		for (let el of $$("#rams .active")) {
			el.classList.remove("active");
		}
		let newActive = $$(`#rams .ram-item-${this.pointer}`);
		if (newActive.length == 0) {
			this.createCell();
			return;
		}
		for (let el of newActive) {
			el.classList.add("active");
			el.scrollIntoView({
				behavior: "smooth",
				inline: "nearest",
			});
		}
	}

	private get pointer() {
		return this._pointer;
	}

	private set pointer(num: number) {
		// Don't allow wrapping (for my own sanity)
		if (num < 0 || num >= this.size) {
			throw new Error("Attempt to set memory pointer out of bounds!");
		}

		this._pointer = num;
		this.updateActive();
	}

	public incrementPointer(): void {
		this.pointer += 1;
	}

	public decrementPointer(): void {
		this.pointer -= 1;
	}

	public get value() {
		return this.data[this.pointer] || 0;
	}

	public set value(value: number) {
		this.data[this.pointer] = value;
		let hex = hexify(value);
		let str = String.fromCodePoint(value);
		$(`#ram-cell-${this.pointer}`).textContent = `0x${hex} '${str}'`;
	}

	public reset(): void {
		this.data = new Array(this.size);
		for (let el of $$("#rams .ram-cell")) {
			el.textContent = DEFAULT_TEXT_VALUE;
		}
		this.pointer = 0;
	}
}
