import { $, $$ } from "./utils.js";
import { HighlightStack } from "./highlighter.js";

const MAX_RAM = 30000;

type RAMElement = HTMLTableCellElement;

export class RAMStack {
	private stack: HighlightStack;
	private size: number;
	private _pointer: number = 0;
	private data: number[];

	constructor(size = MAX_RAM) {
		this.stack = new HighlightStack();
		this.size = size;
		this.data = new Array(this.size);
		// Use the reset function to clean up the display
		this.reset();
	}

	private getCurrentCell(): RAMElement | null {
		return $<RAMElement>(`#cell-${this._pointer}`, true);
	}

	private updateDisplay() {
		let data = this.value;
		let dataDisplay = String.fromCharCode(data);
		let dataHex = data.toString(16);
		$("#memValue").textContent = `'${dataDisplay}' (0x${dataHex})`;
		$("#ramPointer").textContent = this.pointer.toFixed(0);
	}

	private get pointer() {
		return this._pointer;
	}

	private set pointer(num: number) {
		// Hopefully this will do the general trick
		if (num >= this.size) {
			num -= this.size;
		} else if (num < 0) {
			num += this.size;
		}

		let cell = this.getCurrentCell();
		if (cell) {
			cell.classList.remove("active-cell");
		}
		this._pointer = num;
		cell = this.getCurrentCell();
		if (cell) {
			cell.classList.add("active-cell");
			this.stack.promote(cell);
		}
		this.updateDisplay();
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
		this.updateDisplay();
		let cell = this.getCurrentCell();
		if (cell) {
			this.stack.promote(cell);
			cell.textContent = value.toFixed(0);
		}
	}

	public tick(): void {
		this.stack.decay();
	}

	public reset(): void {
		this.data = new Array(this.size);
		this._pointer = 0;
		this.stack.clear();
		$$<RAMElement>(".ram-cell").forEach((node) => {
			node.textContent = "0";
		});
	}
}
