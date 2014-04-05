(function(global) {
    'use strict';

    HTMLElement.prototype.on = function() {
        this.addEventListener.apply(this, arguments);
    };
    HTMLElement.prototype.empty = function() {
        while (this.firstChild) {
            // FIXME: Does this .remove() on the child? We don't want orphan nodes
            this.removeChild(this.firstChild);
        }
    };

    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    function stdout(msg) {
        $('#stdout').textContent += msg;
    }

    function stdin() {
        var el = $('#stdin');
        var value = el.value;
        if (!value.length) {
            return '';
        } else if (1 == value.length) {
            el.value = '';
            return value;
        }
        var ret = value.substr(0, 1);
        el.value = value.substr(1);
        return ret;
    }
    var timeOutNum = 1000,
        timeOutValue = 0,
        running = false;

    var ram = [],
        maxRams = 30000, // FIXME The gui only shows 90
        ramPointer = 0,
        ramStack = new global.HighlightStack();

    function touchCell(cell) {
        ramStack.promote(cell);
    }

    function updatePointer(num) {
        var cell;
        // TODO: Validate num
        cell = $('#cell-' + ramPointer);
        if (cell)
            cell.classList.remove('active-cell');
        ramPointer = num;
        $('#ramPointer').textContent = ramPointer;
        cell = $('#cell-' + num);
        if (cell) {
            cell.classList.add('active-cell');
            touchCell(cell);
        }
    }

    function incrementPointer() {
        var ptr = ramPointer + 1;
        if (ptr >= maxRams)
            ptr = 0;
        updatePointer(ptr);
    }

    function decrementPointer() {
        var ptr = ramPointer - 1;
        if (ptr < 0)
            ptr = maxRams - 1;
        updatePointer(ptr);
    }

    function getRam() {
        return ram[ramPointer] || 0;
    }

    function setRam(value) {
        ram[ramPointer] = value;
        $('#memValue').textContent = "'" + String.fromCharCode(value) + "'";
        var cell = $('#cell-' + ramPointer);
        if (cell) {
            cell.textContent = value;
            touchCell(cell);
        }
    }

    function resetRam() {
        ram = [];
        updatePointer(0);
        $('#memValue').textContent = "''";
        ramStack.clear();
        var nodes = $$('.ram-cell');
        var i;
        for (i = 0; i < nodes.length; i++) {
            nodes[i].textContent = 0;
        }
    }
    resetRam();

    var program = [],
        programStack = new HighlightStack(),
        pc = 0;

    function resetProgram() {
        pc = 0;
        $('#pc').textContent = pc;
        programStack.clear();
        resetRam();
    }

    function haltProgram() {
        running = false;
        $('#program-pause').innerText = 'Resume';
        window.clearTimeout(timeOutValue);
    }

    function resumeProgram() {
        running = true;
        $('#program-pause').innerText = 'Pause';
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
        if (checkForProgramEnd())
            return;
        var token = program[pc],
            cmd = token[1];
        programStack.promote(token[4]);
        var didMemOperation = !(cmd == '[' || cmd == ']');
        var value = getRam();

        if (cmd == '+') {
            value++;
            if (value > 255)
                value = 0;
            setRam(value);
        } else if (cmd == '-') {
            value--;
            if (value < 0)
                value = 255;
            setRam(value);
        } else if (cmd == '<') {
            decrementPointer();
        } else if (cmd == '>') {
            incrementPointer();
        } else if (cmd == ',') {
            value = stdin();
            if ('' !== value) {
                value = value.charCodeAt(0);
                // Sorry Unicode!
                if (value > 255)
                    value = 255;
                if (value < 0)
                    value = 0;
                setRam(value);
            } else {
                // UH-OH, the user hasn't entered anything into stdin.
                // Wait until they do.
                // TODO: Maybe some kind of notification?
                didMemOperation = false;
                pc--;
            }
        } else if (cmd == '.') {
            stdout(String.fromCharCode(value));
        } else if (cmd == '[') {
            if (!value)
                pc = token[2];
        } else if (cmd == ']') {
            if (value)
                pc = token[2];
        } else {
            throw new Error("Unkown opcode '" + cmd + "'!");
        }

        pc++;
        $('#pc').textContent = pc;
        if (checkForProgramEnd())
            return;
        if (!didMemOperation)
            ramStack.decay();
        if (running)
            timeOutValue = window.setTimeout(runProgram, timeOutNum);
    }
    var isComment = /[^<>+\-[\].,]/;

    function tokenizeProgram(text) {
        var prog = [],
            loopStack = [],
            currentComment = '';
        var tokens = text.split('').forEach(function(token) {
            if (isComment.test(token)) {
                currentComment += token;
                return;
            }
            if (currentComment) {
                prog.push(['comment', currentComment]);
                currentComment = '';
            }
            if (token == '[') {
                loopStack.push(prog.length);
                prog.push(['opcode', token, -1]);
            } else if (token == ']') {
                if (!loopStack.length)
                    throw new Error("Unbalanced []s!");
                var match = loopStack.pop();
                prog[match][2] = prog.length;
                prog.push(['opcode', token, match]);
            } else {
                prog.push(['opcode', token]);
            }
        });
        if (currentComment) {
            prog.push(['comment', currentComment]);
        }
        if (loopStack.length > 0)
            throw new Error("Unbalanced []s!");
        return prog;
    }
    // debug
    global.tokenizeProgram = tokenizeProgram;

    var classes = {
        '<': 'lt',
        '>': 'gt',
        '+': 'plus',
        '-': 'dash',
        '[': 'lbrk',
        ']': 'rbrk',
        '.': 'dot',
        ',': 'coma',
    };

    $('#program-compile').on('click', function() {
        var tarea, srccode, progEl, tokens, span;
        tarea = $('#program-input');
        srccode = tarea.value.trim();
        tarea.value = '';
        progEl = $('#program');
        progEl.empty();
        tokens = tokenizeProgram(srccode);
        tokens.forEach(function(token) {
            span = document.createElement('span');
            span.classList.add(token[0]);
            if ('opcode' == token[0]) {
                var tokenClass = classes[token[1]];
                if (tokenClass)
                    span.classList.add(token[0] + '-' + tokenClass);
            }
            span.textContent = token[1];
            token[4] = span;
            progEl.appendChild(span);
        });
        program = tokens.filter(function(token) {
            return token[0] == 'opcode';
        });
        resetProgram();
    });

    $('#exec-speed').on('change', function() {
        timeOutNum = this.value;
    });
    $('#program-step').on('click', function() {
        runProgram();
    });
    $('#program-pause').on('click', function() {
        if (running)
            haltProgram();
        else
            resumeProgram();
    });
    $('#program-restart').on('click', function() {
        resetProgram();
    });

})(this);
