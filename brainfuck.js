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
    var timeOutNum = 1000;

    function runProgram() {
        if (true)
            return;

        // foo

        window.setTimeout(runProgram, timeOutNum);
    }


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

})(this);
