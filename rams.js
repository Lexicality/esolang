((global) => {
    "use strict";

    const {
        $,
        $$,
    } = global.utils;


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

    // FIXME The gui only shows 90
    function initRam(max = 30000) {
        maxRams = max;
        resetRam();
        return {
            resetRam,
            getRam,
            setRam,
            decayRam: () => ramStack.decay(),
            incrementPointer,
            decrementPointer,
        }
    }

    global.rams = {
        initRam,
    };

})(this);
