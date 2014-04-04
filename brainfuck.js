(function(global) {
    'use strict';

    HTMLElement.prototype.on = function() {
        this.addEventListener.apply(this, arguments);
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
        running = true;

    var ram = [],
        maxRams = 90,
        ramPointer = 0,
        ramStack = new global.HighlightStack();

    function updatePointer(num) {
        ramPointer = num;
        ramStack.addItem($('#cell-' + num));
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
    }

    function resetRam() {
        ramPointer = 0;
        ram = [];
        ramStack.clearStack();
    }

    var program = [],
        pc = 0;

    function resetProgram() {
        pc = 0;
        resetRam();
    }

    function runProgram() {
        window.clearTimeout(timeOutValue);
        if (true)
            return;

        // foo

        if (running)
            timeOutValue = window.setTimeout(runProgram, timeOutNum);
    }
    var isComment = /[^<>+-\[\].,]/;

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
                pc++;
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
        if (loopStack.length > 0)
            throw new Error("Unbalanced []s!");
        return prog;
    }
    // debug
    global.tokenizeProgram = tokenizeProgram;

    (function(id) {
        var i, j;
        var tab = document.getElementById(id);
        var thead = tab.querySelector('thead');
        var tbody = tab.querySelector('tbody');
        var tr, td;
        for (i = 0; i < 3; i++) {
            tr = document.createElement('tr');
            tr.id = "row-" + i;
            for (j = 0; j < 30; j++) {
                td = document.createElement('td');
                td.textContent = 0;
                td.id = "cell-" + (i * 30 + j);
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
    })('rams');

    $('#program-compile').on('click', function() {
        var tarea, srccode, progEl, tokens, span;
        tarea = $('#program-input');
        srccode = tarea.value;
        tarea.value = '';
        progEl = $('#program');
        tokens = tokenizeProgram(srccode);
        tokens.forEach(function(token) {
            span = document.createElement('span');
            span.classList.add(token[0]);
            span.textContent = token[1];
            progEl.appendChild(span);
        });
        program = tokens.filter(function(token) {
            return token[1] == 'opcode';
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
        running = !running;
        if (!running) {
            window.clearTimeout(timeOutValue);
        } else {
            runProgram();
        }
    });
    $('#program-restart').on('click', function() {
        resetProgram();
    });

})(this);
