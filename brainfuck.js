(function(global) {
	"use strict";

	const { $, $$, stdout, stdin } = global.utils;

	const { initRam } = global.rams;

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

	var program = [],
		programStack = new HighlightStack(),
		pc = 0;

	function resetProgram() {
		pc = 0;
		$("#pc").textContent = pc;
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
		var token = program[pc],
			cmd = token[1];
		programStack.promote(token[4]);
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
			value = stdin();
			if ("" !== value) {
				value = value.charCodeAt(0);
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
				pc = token[2];
			}
		} else if (cmd == "]") {
			if (value) {
				pc = token[2];
			}
		} else {
			throw new Error("Unkown opcode '" + cmd + "'!");
		}

		pc++;
		$("#pc").textContent = pc;
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

	function tokenizeProgram(text) {
		var prog = [],
			loopStack = [],
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
				if (!loopStack.length) {
					throw new Error("Unbalanced []s!");
				}
				var match = loopStack.pop();
				prog[match[0]][2] = counter;
				prog.push(["opcode", token, match[1]]);
			} else {
				prog.push(["opcode", token]);
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
	// debug
	global.tokenizeProgram = tokenizeProgram;

	var classes = {
		"<": "lt",
		">": "gt",
		"+": "plus",
		"-": "dash",
		"[": "lbrk",
		"]": "rbrk",
		".": "dot",
		",": "coma",
	};

	$("#program-compile").on("click", function() {
		var tarea, srccode, progEl, tokens, span;
		tarea = $("#program-input");
		srccode = tarea.value.trim();
		tarea.value = "";
		progEl = $("#program");
		progEl.empty();
		tokens = tokenizeProgram(srccode);
		tokens.forEach(function(token) {
			span = document.createElement("span");
			span.classList.add(token[0]);
			if ("opcode" == token[0]) {
				var tokenClass = classes[token[1]];
				if (tokenClass) {
					span.classList.add(token[0] + "-" + tokenClass);
				}
			}
			span.textContent = token[1];
			token[4] = span;
			progEl.appendChild(span);
		});
		program = tokens.filter(function(token) {
			return token[0] == "opcode";
		});
		resetProgram();
	});

	$("#exec-speed").on("change", function() {
		timeOutNum = this.value;
	});
	$("#program-step").on("click", function() {
		runProgram();
	});
	$("#program-pause").on("click", function() {
		if (running) {
			haltProgram();
		} else {
			resumeProgram();
		}
	});
	$("#program-restart").on("click", function() {
		resetProgram();
	});
})(this);
