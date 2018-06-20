import { $, $$, stdout, stdin } from "./utils.js";

import { initRam } from "./rams.js";

import { HighlightStack } from "./highlighter.js";

const {
	resetRam,
	getRam,
	setRam,
	decayRam,
	incrementPointer,
	decrementPointer,
} = initRam(30000);

var timeOutNum = 1000,
	timeOutValue = 0,
	running = false;

type MemoryOpcode = "<" | ">" | "+" | "-" | "." | ",";
type LoopOpcode = "[" | "]";
type Opcode = MemoryOpcode | LoopOpcode;

type ParsedComment = ["comment", string];
type ParsedOpcode = ["opcode", MemoryOpcode] | ["opcode", LoopOpcode, number];
type ParserOutput = ParsedComment | ParsedOpcode;

type ProgramStep =
	| [undefined, MemoryOpcode, undefined, undefined, HTMLSpanElement]
	| [undefined, LoopOpcode, number, undefined, HTMLSpanElement];

var program: ProgramStep[] = [],
	programStack = new HighlightStack(),
	pc = 0;

function resetProgram() {
	pc = 0;
	$("#pc").textContent = pc.toFixed(0);
	programStack.clear();
	resetRam();
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

function runProgram() {
	window.clearTimeout(timeOutValue);
	if (checkForProgramEnd()) {
		return;
	}
	let token = program[pc];
	let cmd = token[1];
	let el = token[4];
	programStack.promote(el);
	var didMemOperation = !(cmd == "[" || cmd == "]");
	var value = getRam();

	if (cmd == "+") {
		value++;
		if (value > 255) {
			value = 0;
		}
		setRam(value);
	} else if (cmd == "-") {
		value--;
		if (value < 0) {
			value = 255;
		}
		setRam(value);
	} else if (cmd == "<") {
		decrementPointer();
	} else if (cmd == ">") {
		incrementPointer();
	} else if (cmd == ",") {
		let input = stdin();
		if ("" !== input) {
			value = input.charCodeAt(0);
			// Sorry Unicode!
			if (value > 255) {
				value = 255;
			}
			if (value < 0) {
				value = 0;
			}
			setRam(value);
		} else {
			// UH-OH, the user hasn't entered anything into stdin.
			// Wait until they do.
			// TODO: Maybe some kind of notification?
			didMemOperation = false;
			pc--;
		}
	} else if (cmd == ".") {
		stdout(String.fromCharCode(value));
	} else if (cmd == "[") {
		if (!value) {
			pc = token[2]!;
		}
	} else if (cmd == "]") {
		if (value) {
			pc = token[2]!;
		}
	} else {
		throw new Error("Unkown opcode '" + cmd + "'!");
	}

	pc++;
	$("#pc").textContent = pc.toFixed(0);
	if (checkForProgramEnd()) {
		return;
	}
	if (!didMemOperation) {
		decayRam();
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
	var tokens = text.split("").forEach(function(token) {
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
			prog.push(["opcode", token as MemoryOpcode]);
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

$("#program-compile").addEventListener("click", function() {
	let tarea: HTMLTextAreaElement = $("#program-input");
	let srccode = tarea.value.trim();
	tarea.value = "";
	let progEl = $("#program");
	emptyElement(progEl);
	let tokens = tokenizeProgram(srccode);
	program = tokens
		.map(
			(token): ProgramStep | undefined => {
				let span = document.createElement("span");
				span.classList.add(token[0]);
				span.textContent = token[1];
				progEl.appendChild(span);
				if ("opcode" == token[0]) {
					var tokenClass = classes[token[1]];
					if (tokenClass) {
						span.classList.add(token[0] + "-" + tokenClass);
					}

					return [
						undefined,
						token[1],
						token[2],
						undefined,
						span,
					] as any;
				}
				return undefined;
			},
		)
		.filter((token): token is ProgramStep => !!token);
	resetProgram();
});

$("#exec-speed").addEventListener("change", function() {
	timeOutNum = parseInt((this as HTMLInputElement).value);
});
$("#program-step").addEventListener("click", function() {
	runProgram();
});
$("#program-pause").addEventListener("click", function() {
	if (running) {
		haltProgram();
	} else {
		resumeProgram();
	}
});
$("#program-restart").addEventListener("click", function() {
	resetProgram();
});
