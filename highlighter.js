(function(global) {
    'use strict';

    var maxStack = 5,
        className = 'trail-step-';

    var guid = (function() {
        function fourChars() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1).toUpperCase();
        }
        return function() {
            return (fourChars() + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + fourChars() + fourChars());
        };
    })();

    function getGuid(el) {
        if (el._guid)
            return el._guid;
        return (el._guid = guid());
    }

    function StackItem(el) {
        this.el = el;
        this.stage = 0;
        this.el.classList.add(className + 0);
    }
    StackItem.prototype.step = function() {
        this.setStage(this.stage + 1);
    };
    StackItem.prototype.setStage = function(stage) {
        var cl = this.el.classList;
        cl.remove(className + this.stage);
        if (stage < maxStack)
            cl.add(className + stage);
        this.stage = stage;
    };
    StackItem.prototype.deactivate = function() {
        this.el.classList.remove(className + this.stage);
    };

    function HighlightStack() {
        this.items = [];
        this.lookup = {};
    }

    function step(item) {
        item.step();
    }
    HighlightStack.prototype.addItem = function(el) {
        var guid = getGuid(el);
        var item = this.lookup[guid];
        if (item)
            return this.promoteItem(item);
        item = new StackItem(el);
        this.lookup[guid] = item;
        this.items.forEach(step);
        this.items.unshift(item);
        if (this.items.length > maxStack)
            delete this.lookup[this.items.pop().el];
    };

    function setStageByIndex(item, i) {
        item.setStage(i);
    }
    HighlightStack.prototype.promoteItem = function(item) {
        this.items.splice(this.items.indexOf(item), 1);
        this.items.unshift(item);
        this.items.forEach(setStageByIndex);
    };
    global.HighlightStack = HighlightStack;


    global.testStack = function(el) {
        var stack = new HighlightStack();
        for (var i = 0; i < maxStack + 1; i++) {
            stack.addItem(el);
            el = el.nextSibling;
        }
        return stack;
    };
})(this);
