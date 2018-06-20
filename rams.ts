import { $, $$ } from "./utils.js";
import { HighlightStack } from "./highlighter.js";

var ram: number[] = [],
	maxRams = 30000, // FIXME The gui only shows 90
	ramPointer = 0,
	ramStack = new HighlightStack();

type RAMElement = HTMLElement;

function touchCell(cell: RAMElement): void {
	ramStack.promote(cell);
}

function updatePointer(num: number): void {
	var cell: RAMElement;
	// TODO: Validate num
	cell = $("#cell-" + ramPointer);
	if (cell) {
		cell.classList.remove("active-cell");
	}
	ramPointer = num;
	$("#ramPointer").textContent = ramPointer.toFixed(0);
	cell = $("#cell-" + num);
	if (cell) {
		cell.classList.add("active-cell");
		touchCell(cell);
	}
}

function incrementPointer(): void {
	var ptr = ramPointer + 1;
	if (ptr >= maxRams) {
		ptr = 0;
	}
	updatePointer(ptr);
}

function decrementPointer(): void {
	var ptr = ramPointer - 1;
	if (ptr < 0) {
		ptr = maxRams - 1;
	}
	updatePointer(ptr);
}

function getRam(): number {
	return ram[ramPointer] || 0;
}

function setRam(value: number): void {
	ram[ramPointer] = value;
	$("#memValue").textContent = "'" + String.fromCharCode(value) + "'";
	var cell = $("#cell-" + ramPointer);
	if (cell) {
		cell.textContent = value.toFixed(0);
		touchCell(cell);
	}
}

function resetRam(): void {
	ram = [];
	updatePointer(0);
	$("#memValue").textContent = "''";
	ramStack.clear();
	var nodes = $$(".ram-cell");
	var i;
	for (i = 0; i < nodes.length; i++) {
		nodes[i].textContent = "0";
	}
}

// FIXME The gui only shows 90
export function initRam(max = 30000) {
	maxRams = max;
	resetRam();
	return {
		resetRam,
		getRam,
		setRam,
		decayRam: () => ramStack.decay(),
		incrementPointer,
		decrementPointer,
	};
}
