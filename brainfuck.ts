import { $, $$, stdout, stdin } from "./utils.js";

import { RAMStack } from "./rams.js";

import { HighlightStack } from "./highlighter.js";

let ram = new RAMStack();

var timeOutNum = 1000,
	timeOutValue = 0,
	running = false;

type MemoryOpcode = "<" | ">" | "+" | "-" | "." | ",";
type LoopOpcode = "[" | "]";
type Opcode = MemoryOpcode | LoopOpcode;

type ParsedComment = ["comment", string];
type ParsedOpcode =
	| ["opcode", MemoryOpcode, undefined]
	| ["opcode", LoopOpcode, number];
type ParserOutput = ParsedComment | ParsedOpcode;

type ProgramStep = [Opcode, number | undefined, HTMLSpanElement];

let program: ProgramStep[] = [];
let programStack: HighlightStack<HTMLSpanElement>;
let pc = 0;

function resetProgram() {
	pc = 0;
	$("#pc").textContent = pc.toFixed(0);
	programStack.reset();
	ram.reset();
}

function haltProgram() {
	running = false;
	$("#program-pause").innerText = "Resume";
	window.clearTimeout(timeOutValue);
}

function resumeProgram() {
	running = true;
	$("#program-pause").innerText = "Pause";
	runProgram();
}

function checkForProgramEnd() {
	if (!program[pc]) {
		haltProgram();
		return true;
	}
	return false;
}

function wrap_uint8(value: number): number {
	if (value > 255) {
		value = 0;
	} else if (value < 0) {
		value = 255;
	}

	return value;
}

function clamp_uint8(value: number): number {
	if (value > 255) {
		value = 255;
	} else if (value < 0) {
		value = 0;
	}

	return value;
}

function runProgram() {
	window.clearTimeout(timeOutValue);
	if (checkForProgramEnd()) {
		return;
	}
	let [cmd, param, el] = program[pc];
	programStack.promote(el);
	var value = ram.value;

	if (cmd == "+") {
		ram.value = wrap_uint8(value + 1);
	} else if (cmd == "-") {
		ram.value = wrap_uint8(value - 1);
	} else if (cmd == "<") {
		ram.decrementPointer();
	} else if (cmd == ">") {
		ram.incrementPointer();
	} else if (cmd == ",") {
		let input = stdin();
		if ("" !== input) {
			// Sorry Unicode!
			ram.value = clamp_uint8(input.charCodeAt(0));
		} else {
			// UH-OH, the user hasn't entered anything into stdin.
			// Wait until they do.
			// TODO: Maybe some kind of notification?
			pc--;
		}
	} else if (cmd == ".") {
		stdout(String.fromCharCode(value));
		ram.readValue();
	} else if (cmd == "[") {
		ram.readValue();
		if (!value) {
			pc = param!;
		}
	} else if (cmd == "]") {
		ram.readValue();
		if (value) {
			pc = param!;
		}
	} else {
		throw new Error("Unkown opcode '" + cmd + "'!");
	}

	pc++;
	$("#pc").textContent = pc.toFixed(0);
	if (checkForProgramEnd()) {
		return;
	}
	if (running) {
		timeOutValue = window.setTimeout(runProgram, timeOutNum);
	}
}
var isComment = /[^<>+\-[\].,]/;

function tokenizeProgram(text: string): ParserOutput[] {
	var prog: ParserOutput[] = [],
		loopStack: [number, number][] = [],
		currentComment = "",
		counter = 0;
	var tokens = text.split("").forEach(function (token) {
		if (isComment.test(token)) {
			currentComment += token;
			return;
		}
		if (currentComment) {
			prog.push(["comment", currentComment]);
			currentComment = "";
		}
		if (token == "[") {
			loopStack.push([prog.length, counter]);
			prog.push(["opcode", token, -1]);
		} else if (token == "]") {
			var match = loopStack.pop();
			if (!match) {
				throw new Error("Unbalanced []s!");
			}
			prog[match[0]][2] = counter;
			prog.push(["opcode", token, match[1]]);
		} else {
			prog.push(["opcode", token as MemoryOpcode, undefined]);
		}
		counter++;
	});
	if (currentComment) {
		prog.push(["comment", currentComment]);
	}
	if (loopStack.length > 0) {
		throw new Error("Unbalanced []s!");
	}
	return prog;
}

function emptyElement(el: HTMLElement): void {
	while (el.firstChild) {
		// FIXME: Does el .remove() on the child? We don't want orphan nodes
		el.removeChild(el.firstChild);
	}
}

var classes: { [key: string]: string } = {
	"<": "lt",
	">": "gt",
	"+": "plus",
	"-": "dash",
	"[": "lbrk",
	"]": "rbrk",
	".": "dot",
	",": "coma",
};

function is_opcode(output: ParserOutput): output is ParsedOpcode {
	return output[0] == "opcode";
}

$("#program-compile").addEventListener("click", function () {
	let tarea: HTMLTextAreaElement = $("#program-input");
	let srccode = tarea.value.trim();
	tarea.value = "";
	let progEl = $("#program");
	emptyElement(progEl);
	let tokens = tokenizeProgram(srccode);
	program = tokens
		.map((token: ParserOutput, i: number): ProgramStep | undefined => {
			let span = document.createElement("span");
			span.id = `program-${i}`;
			span.classList.add(token[0]);
			span.textContent = token[1];
			progEl.appendChild(span);
			if (is_opcode(token)) {
				var tokenClass = classes[token[1]];
				if (tokenClass) {
					span.classList.add(token[0] + "-" + tokenClass);
				}

				return [token[1], token[2], span];
			}
			return undefined;
		})
		.filter((token): token is ProgramStep => !!token);

	programStack = new HighlightStack($$("#program > .opcode"));
	resetProgram();
});

$("#exec-speed").addEventListener("change", function () {
	timeOutNum = parseInt((this as HTMLInputElement).value);
});
$("#program-step").addEventListener("click", function () {
	runProgram();
});
$("#program-pause").addEventListener("click", function () {
	if (running) {
		haltProgram();
	} else {
		resumeProgram();
	}
});
$("#program-restart").addEventListener("click", function () {
	resetProgram();
});
