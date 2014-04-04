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
    var timeOutNum = 1000,
        timeOutValue = 0,
        running = false;

    var ram = [],
        maxRams = 90, // FIXME We probably need more than 90. Say a 30k-ish?
        ramPointer = 0,
        ramStack = new global.HighlightStack();

    function touchCell(cell) { // cell is optional
        ramStack.promote(cell || $('#cell-' + ramPointer));
    }

    function updatePointer(num) {
        var cell;
        // TODO: Validate num
        cell = $('#cell-' + ramPointer);
        if (cell)
            cell.classList.remove('active-cell');
        ramPointer = num;
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
        touchCell();
    }

    function resetRam() {
        ram = [];
        updatePointer(0);
        ramStack.clear();
    }
    resetRam();

    var program = [],
        pc = 0;

    function resetProgram() {
        pc = 0;
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

    function runProgram() {
        window.clearTimeout(timeOutValue);
        if (true)
            return;

        // foo

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
