((global) => {
    "use strict";
    var on = function() {
        this.addEventListener.apply(this, arguments);
    };
    var empty = function() {
        while (this.firstChild) {
            // FIXME: Does this .remove() on the child? We don't want orphan nodes
            this.removeChild(this.firstChild);
        }
    };

    function $(selector) {
        var el = document.querySelector(selector);
        if (!el)
            return el;
        el.on = on;
        el.empty = empty;
        return el;
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

    global.utils = {
        $,
        $$,
        stdin,
        stdout,
    };
})(this);
