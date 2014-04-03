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
        ramPointer = 0,
        ramStack = new global.HighlightStack();

    function updatePointer(num) {
        ramPointer = num;
        ramStack.addItem($('#cell-' + num));
    }

    function getRam() {
        return ram[ramPointer] || 0;
    }

    function setRam(value) {
        ram[ramPointer] = value;
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
        var tarea = $('#program-input');
        var programSrc = tarea.value;
        tarea.value = '';
        var program = $('#program');
        program.textContent = programSrc;
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

})(this);
