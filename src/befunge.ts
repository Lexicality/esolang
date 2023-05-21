import { HighlightStack } from "./highlighter.js";
import { closeModal, openModal } from "./modal.js";
import { StackRam } from "./rams.js";
import {
	$,
	$$,
	requestNumber,
	resetStdin,
	resetStdout,
	stdin,
	stdout,
} from "./utils.js";

const WIDTH = 80;
const HEIGHT = 25;

const DIRECTION_OPCODES = ["v", ">", "^", "<", "?"] as const;
const BRANCH_OPCODES = ["_", "|"] as const;
const OPERATOR_OPCODES = ["+", "-", "*", "/", "%", "!", "`"] as const;
const STACK_OPCODES = [":", "\\", "$"] as const;
const IO_OPCODES = [".", ",", "&", "~"] as const;
const SPECIAL_OPCODES = ["@", "#", '"', "g", "p", " "] as const;
const LITERAL_OPCODES = [
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
] as const;
const VALID_OPCODES = [
	...DIRECTION_OPCODES,
	...BRANCH_OPCODES,
	...OPERATOR_OPCODES,
	...STACK_OPCODES,
	...IO_OPCODES,
	...SPECIAL_OPCODES,
	...LITERAL_OPCODES,
];

type DirectionOpcode = (typeof DIRECTION_OPCODES)[number];
function isDirectionOpcode(opcode: any): opcode is DirectionOpcode {
	return DIRECTION_OPCODES.includes(opcode);
}
type BranchOpcode = (typeof BRANCH_OPCODES)[number];
function isBranchOpcode(opcode: any): opcode is BranchOpcode {
	return BRANCH_OPCODES.includes(opcode);
}
type OperatorOpcode = (typeof OPERATOR_OPCODES)[number];
function isOperatorOpcode(opcode: any): opcode is OperatorOpcode {
	return OPERATOR_OPCODES.includes(opcode);
}
type StackOpcode = (typeof STACK_OPCODES)[number];
function isStackOpcode(opcode: any): opcode is StackOpcode {
	return STACK_OPCODES.includes(opcode);
}
type IOOpcode = (typeof IO_OPCODES)[number];
function isIOOpcode(opcode: any): opcode is IOOpcode {
	return IO_OPCODES.includes(opcode);
}
type SpecialOpcode = (typeof SPECIAL_OPCODES)[number];
function isSpecialOpcode(opcode: any): opcode is SpecialOpcode {
	return SPECIAL_OPCODES.includes(opcode);
}
type LiteralOpcode = (typeof LITERAL_OPCODES)[number];
function isLiteralOpcode(opcode: any): opcode is LiteralOpcode {
	return LITERAL_OPCODES.includes(opcode);
}
type Opcode = (typeof VALID_OPCODES)[number];
function isOpcode(opcode: any): opcode is Opcode {
	return VALID_OPCODES.includes(opcode);
}

const enum Direction {
	Up,
	Right,
	Down,
	Left,
}

function reverse(dir: Direction): Direction {
	switch (dir) {
		case Direction.Up:
			return Direction.Down;
		case Direction.Right:
			return Direction.Left;
		case Direction.Down:
			return Direction.Up;
		case Direction.Left:
			return Direction.Right;
	}
}

function arrow(dir: Direction): string {
	switch (dir) {
		case Direction.Up:
			return "⬆";
		case Direction.Right:
			return "➡";
		case Direction.Down:
			return "⬇";
		case Direction.Left:
			return "⬅";
	}
}

function randir(): Direction {
	return Math.floor(Math.random() * 4);
}

type Coordinate = [x: number, y: number];

function walk(from: Coordinate, dir: Direction): Coordinate {
	let [x, y] = from;
	switch (dir) {
		case Direction.Up:
			return [x, y - 1];
		case Direction.Right:
			return [x + 1, y];
		case Direction.Down:
			return [x, y + 1];
		case Direction.Left:
			return [x - 1, y];
	}
}

function wrap(coord: Coordinate): Coordinate {
	let [x, y] = coord;
	// The cursor cannot move diagonally which lets this be a lot simpler
	if (x < 0) {
		return [x + WIDTH, y];
	} else if (x >= WIDTH) {
		return [x - WIDTH, y];
	} else if (y < 0) {
		return [x, y + HEIGHT];
	} else if (y >= HEIGHT) {
		return [x, y - HEIGHT];
	}
	return coord;
}

function inBounds(coord: Coordinate): boolean {
	let [x, y] = coord;
	return x >= 0 && x < WIDTH && y >= 0 && y <= HEIGHT;
}

let stack = new StackRam();

let executionDelay = 1000,
	timeoutHandle = 0,
	running = false;

type ProgramStep = [string, HTMLSpanElement];

let program: ProgramStep[][] = [];
let programStack: HighlightStack<HTMLSpanElement>;
let pc: Coordinate;
let pcDir: Direction;
let stringMode: boolean;

function resetProgram() {
	pc = [0, 0];
	pcDir = Direction.Right;
	stringMode = false;
	resetStdin();
	resetStdout();
	programStack.reset();
	stack.reset();
	let pause = $<HTMLButtonElement>("#program-pause");
	pause.innerText = "Start";
	pause.disabled = false;
	$<HTMLButtonElement>("#program-step").disabled = false;
	$<HTMLButtonElement>("#program-restart").disabled = false;
	$<HTMLElement>("#dir").textContent = arrow(pcDir);
}

function haltProgram() {
	running = false;
	$("#program-pause").innerText = "Resume";
	window.clearTimeout(timeoutHandle);
}

function resumeProgram() {
	running = true;
	$("#program-pause").innerText = "Pause";
	runProgram();
}

function runProgram() {
	window.clearTimeout(timeoutHandle);
	let [char, el] = program[pc[1]][pc[0]];
	programStack.promote(el);
	el.scrollIntoView({
		behavior: "smooth",
		block: "nearest",
	});

	if (stringMode) {
		if (char == '"') {
			stringMode = false;
		} else {
			stack.push(char.charCodeAt(0));
		}
	} else if (isDirectionOpcode(char)) {
		switch (char) {
			case "^":
				pcDir = Direction.Up;
				break;
			case ">":
				pcDir = Direction.Right;
				break;
			case "v":
				pcDir = Direction.Down;
				break;
			case "<":
				pcDir = Direction.Left;
				break;
			case "?":
				pcDir = randir();
				break;
		}
	} else if (isBranchOpcode(char)) {
		let val = stack.pop() != 0;
		switch (char) {
			case "_":
				if (val) {
					pcDir = Direction.Left;
				} else {
					pcDir = Direction.Right;
				}
				break;
			case "|":
				if (val) {
					pcDir = Direction.Up;
				} else {
					pcDir = Direction.Down;
				}
		}
	} else if (isOperatorOpcode(char)) {
		let v1 = stack.pop();
		let v2: number;
		switch (char) {
			case "!":
				stack.push(v1 == 0 ? 1 : 0);
				break;
			case "%":
				v2 = stack.pop();
				stack.push(v2 % v1);
				break;
			case "*":
				v2 = stack.pop();
				stack.push(v2 * v1);
				break;
			case "+":
				v2 = stack.pop();
				stack.push(v2 + v1);
				break;
			case "-":
				v2 = stack.pop();
				stack.push(v2 - v1);
				break;
			case "/":
				v2 = stack.pop();
				stack.push(Math.floor(v2 / v1));
				break;
			case "`":
				v2 = stack.pop();
				stack.push(v2 > v1 ? 1 : 0);
				break;
		}
	} else if (isStackOpcode(char)) {
		switch (char) {
			case ":":
				stack.duplicate();
				break;
			case "\\":
				let v1 = stack.pop();
				let v2 = stack.pop();
				stack.push(v1);
				stack.push(v2);
				break;
			case "$":
				stack.pop();
				break;
		}
	} else if (isIOOpcode(char)) {
		switch (char) {
			case ".":
				stdout(stack.pop().toFixed(0) + " ");
				break;
			case ",":
				stdout(String.fromCharCode(stack.pop()));
				break;
			case "&":
				try {
					stack.push(requestNumber());
				} catch (e) {
					haltProgram();
					return;
				}
				break;
			case "~":
				try {
					let input = stdin();
					stack.push(input.charCodeAt(0));
				} catch (e) {
					haltProgram();
					return;
				}
				break;
		}
	} else if (isSpecialOpcode(char)) {
		let x: number, y: number;
		switch (char) {
			case "@":
				haltProgram();
				$<HTMLButtonElement>("#program-pause").disabled = true;
				$<HTMLButtonElement>("#program-step").disabled = true;
				return;
			case "#":
				pc = walk(pc, pcDir);
				break;
			case '"':
				stringMode = true;
				break;
			case "g":
				y = stack.pop();
				x = stack.pop();
				if (!inBounds([x, y])) {
					break;
				}
				let [targetChar, _] = program[y][x];
				stack.push(targetChar.charCodeAt(0));
				break;
			case "p":
				y = stack.pop();
				x = stack.pop();
				let newInstruction = String.fromCharCode(stack.pop());
				if (!inBounds([x, y])) {
					break;
				}
				let progEntry = program[y][x];
				progEntry[0] = newInstruction;
				let targetEl = progEntry[1];
				targetEl.textContent = newInstruction;
				targetEl.className = "";
				let tokenType = getTokenType(newInstruction);
				targetEl.classList.add("token", `token-${tokenType}`);
				break;
			case " ":
				// do nothing
				break;
		}
	} else if (isLiteralOpcode(char)) {
		stack.push(parseInt(char, 10));
	} else {
		// Befunge 93 doesn't specify what should happen in this case, but Befunge 98
		// suggests the cursor should bounce, so let's do that
		pcDir = reverse(pcDir);
	}

	$<HTMLElement>("#dir").textContent = arrow(pcDir);

	pc = wrap(walk(pc, pcDir));
	if (running) {
		timeoutHandle = window.setTimeout(runProgram, executionDelay);
	}
}

function getTokenType(char: string): string {
	if (isDirectionOpcode(char)) {
		return "loop";
	} else if (isBranchOpcode(char)) {
		return "conditional";
	} else if (isOperatorOpcode(char)) {
		return "operator";
	} else if (isStackOpcode(char)) {
		return "macro";
	} else if (isIOOpcode(char)) {
		return "func";
	} else if (isSpecialOpcode(char)) {
		return "special";
	} else if (isLiteralOpcode(char)) {
		return "literal";
	} else {
		return "comment";
	}
}

function newProgram(srccode: string): void {
	let progEl = $("#program");
	progEl.textContent = "";
	let lines = srccode.replaceAll("\r", "").split("\n");
	let numLines = lines.length;
	if (numLines > HEIGHT) {
		throw new Error("Program has more than 25 lines!");
	} else if (numLines < HEIGHT) {
		for (let i = numLines; i < HEIGHT; i++) {
			lines.push("");
		}
	}
	let x = 0,
		y = 0;
	program = [];
	for (let line of lines) {
		let programLine: ProgramStep[] = [];
		line = line.padEnd(WIDTH, " ");
		if (line.length > WIDTH) {
			throw new Error(`Line ${y} is more than ${WIDTH} characters long!`);
		}
		for (let char of line) {
			let span = document.createElement("span");
			span.id = `program-${x}-${y}`;
			span.textContent = char;
			let tokenType = getTokenType(char);
			span.classList.add("token", `token-${tokenType}`);
			progEl.append(span);
			programLine.push([char, span]);
			x += 1;
		}
		progEl.append("\n");
		program.push(programLine);
		y += 1;
	}

	programStack = new HighlightStack($$("#program > .token"));
	resetProgram();
}

$("#compiler-form").addEventListener("submit", (event) => {
	event.preventDefault();
	let tarea: HTMLTextAreaElement = $("#program-input");
	let errors = $("#compiler-errors");
	errors.innerText = "";
	try {
		newProgram(tarea.value);
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
		executionDelay = val;
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
window.addEventListener("error", (event) => {
	alert(
		"Error at " +
			`${event.filename}:${event.lineno}:${event.colno}` +
			":\n\t" +
			event.message,
	);
});
