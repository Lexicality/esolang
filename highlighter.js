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
	HighlightStack.prototype.decay = function() {
		this.items.forEach(step);
	};

	HighlightStack.prototype.promote = function(el) {
		if (!el)
			return;
		else if (!(el instanceof HTMLElement))
			throw new Error("Invalid argument");
		this.decay();
		var guid = getGuid(el);
		var item = this.lookup[guid];
		if (item)
			return this._existingItem(item);
		item = new StackItem(el);
		this.lookup[guid] = item;
		this.items.unshift(item);
		if (this.items.length > maxStack)
			delete this.lookup[this.items.pop().el];
	};

	HighlightStack.prototype._existingItem = function(item) {
		this.items.splice(this.items.indexOf(item), 1);
		this.items.unshift(item);
		item.setStage(0);
	};

	function nukeItem(item) {
		item.deactivate();
	}
	HighlightStack.prototype.clear = function() {
		this.items.forEach(nukeItem);
		this.items = [];
		this.lookup = {};
	};

	global.HighlightStack = HighlightStack;
	global.testStack = function(el) {
		var stack = new HighlightStack();
		for (var i = 0; i < maxStack + 1; i++) {
			stack.promote(el);
			el = el.nextSibling;
		}
		return stack;
	};
})(this);
