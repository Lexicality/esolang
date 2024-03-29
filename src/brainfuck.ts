import { HighlightStack } from "./highlighter.js";
import { closeModal, openModal } from "./modal.js";
import { BFRam } from "./rams.js";
import { $, $$, resetStdin, resetStdout, stdin, stdout } from "./utils.js";

let ram = new BFRam();

let timeOutNum = 1000,
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
	// $("#pc").textContent = "0";
	resetStdin();
	resetStdout();
	programStack.reset();
	ram.reset();
	let pause = $<HTMLButtonElement>("#program-pause");
	pause.innerText = "Start";
	pause.disabled = false;
	$<HTMLButtonElement>("#program-step").disabled = false;
	$<HTMLButtonElement>("#program-restart").disabled = false;
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
		$<HTMLButtonElement>("#program-pause").disabled = true;
		$<HTMLButtonElement>("#program-step").disabled = true;
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
	return Math.max(0, Math.min(255, value));
}

function runProgram() {
	window.clearTimeout(timeOutValue);
	if (checkForProgramEnd()) {
		return;
	}
	let [cmd, param, el] = program[pc];
	programStack.promote(el);
	el.scrollIntoView({
		behavior: "smooth",
		block: "nearest",
	});
	let value = ram.value;

	if (cmd == "+") {
		ram.value = wrap_uint8(value + 1);
	} else if (cmd == "-") {
		ram.value = wrap_uint8(value - 1);
	} else if (cmd == "<") {
		try {
			ram.decrementPointer();
		} catch (e) {
			console.error(e);
			alert("Attempted memory pointer underflow");
			haltProgram();
			return;
		}
	} else if (cmd == ">") {
		try {
			ram.incrementPointer();
		} catch (e) {
			console.error(e);
			alert("Attempted memory pointer overflow");
			haltProgram();
			return;
		}
	} else if (cmd == ",") {
		try {
			ram.value = clamp_uint8(stdin().charCodeAt(0));
		} catch (e) {
			haltProgram();
			return;
		}
	} else if (cmd == ".") {
		stdout(String.fromCharCode(value));
	} else if (cmd == "[") {
		if (!value) {
			pc = param!;
		}
	} else if (cmd == "]") {
		if (value) {
			pc = param!;
		}
	} else {
		throw new Error("Unkown opcode '" + cmd + "'!");
	}

	pc++;
	if (checkForProgramEnd()) {
		return;
	}
	if (running) {
		timeOutValue = window.setTimeout(runProgram, timeOutNum);
	}
}
const COMMENT_RE = /[^<>+\-[\].,]/;

function tokenizeProgram(text: string): ParserOutput[] {
	let prog: ParserOutput[] = [],
		loopStack: [number, number][] = [],
		currentComment = "",
		counter = 0;
	let tokens = text.split("").forEach(function (token) {
		if (COMMENT_RE.test(token)) {
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
			let match = loopStack.pop();
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

const SYMBOL_NAMES = {
	"<": "mp-decr",
	">": "mp-incr",
	"+": "value-incr",
	"-": "value-decr",
	"[": "loop-start",
	"]": "loop-end",
	".": "output",
	",": "input",
};
const SYMBOL_SYNTAX_TYPE = {
	"<": "special",
	">": "special",
	"+": "operator",
	"-": "operator",
	"[": "loop",
	"]": "loop",
	".": "func",
	",": "func",
};

function is_opcode(output: ParserOutput): output is ParsedOpcode {
	return output[0] == "opcode";
}

function newProgram(srccode: string): void {
	let progEl = $("#program");
	progEl.textContent = "";
	let tokens = tokenizeProgram(srccode);
	program = tokens
		.map((token: ParserOutput, i: number): ProgramStep | undefined => {
			let [kind, value] = token;
			let span = document.createElement("span");

			span.id = `program-${i}`;
			span.classList.add(kind);
			span.textContent = value;
			progEl.appendChild(span);

			if (!is_opcode(token)) {
				span.classList.add("token-comment");
				return undefined;
			}
			let opcode = token[1];
			let name = SYMBOL_NAMES[opcode];
			let syntax = SYMBOL_SYNTAX_TYPE[opcode];
			span.classList.add(`token-${syntax}`, `opcode-${name}`);

			return [token[1], token[2], span];
		})
		.filter((token): token is ProgramStep => !!token);

	programStack = new HighlightStack($$("#program > .opcode"));
	resetProgram();
}

$("#compiler-form").addEventListener("submit", (event) => {
	event.preventDefault();
	let tarea: HTMLTextAreaElement = $("#program-input");
	let errors = $("#compiler-errors");
	errors.innerText = "";
	try {
		newProgram(tarea.value.trim());
	} catch (e) {
		if (e instanceof Error) {
			e = e.message;
		}
		errors.innerText = e + "";
		return;
	}
	tarea.value = "";
	closeModal($("#compiler-modal"));
});

function updateSpeed() {
	let val = $<HTMLInputElement>("#exec-speed").valueAsNumber;
	if (!isNaN(val)) {
		timeOutNum = val;
	}
}

$("#exec-speed").addEventListener("change", updateSpeed);
updateSpeed();
$("#program-step").addEventListener("click", runProgram);
$("#program-pause").addEventListener("click", () => {
	if (running) {
		haltProgram();
	} else {
		resumeProgram();
	}
});
$("#program-restart").addEventListener("click", resetProgram);
$("#program-new").addEventListener("click", () => {
	haltProgram();
	openModal($("#compiler-modal"));
});

openModal($("#compiler-modal"));
