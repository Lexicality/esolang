var maxStack = 5,
	className = "trail-step-";

var guid = (function() {
	function fourChars() {
		return (((1 + Math.random()) * 0x10000) | 0)
			.toString(16)
			.substring(1)
			.toUpperCase();
	}
	return function() {
		return (
			fourChars() +
			fourChars() +
			"-" +
			fourChars() +
			"-" +
			fourChars() +
			"-" +
			fourChars() +
			"-" +
			fourChars() +
			fourChars() +
			fourChars()
		);
	};
})();

function getGuid(el: any): string {
	if (!el._guid) {
		el._guid = guid();
	}
	return el._guid;
}

class StackItem {
	private el: HTMLElement;
	private stage: number;

	get guid(): string {
		return getGuid(this.el);
	}

	constructor(el: HTMLElement) {
		this.el = el;
		this.stage = 0;
		this.el.classList.add(className + 0);
	}

	step(): void {
		this.setStage(this.stage + 1);
	}

	setStage(stage: number): void {
		var cl = this.el.classList;
		cl.remove(className + this.stage);
		if (stage < maxStack) {
			cl.add(className + stage);
		}
		this.stage = stage;
	}

	deactivate(): void {
		this.el.classList.remove(className + this.stage);
	}
}

export class HighlightStack {
	private items: StackItem[];
	private lookup: { [guid: string]: StackItem };

	constructor() {
		this.items = [];
		this.lookup = {};
	}

	decay(): void {
		this.items.forEach((item) => item.step());
	}

	private lookupItem(el: HTMLElement) {}

	promote(el: HTMLElement): void {
		if (!el) {
			return;
		} else if (!(el instanceof HTMLElement)) {
			throw new Error("Invalid argument");
		}

		this.decay();
		var guid = getGuid(el);
		var item = this.lookup[guid];
		if (item) {
			return this.promoteExistingItem(item);
		}
		item = new StackItem(el);
		this.lookup[guid] = item;
		this.items.unshift(item);
		if (this.items.length > maxStack) {
			let toKill = this.items.pop();
			delete this.lookup[toKill!.guid];
		}
	}

	private promoteExistingItem(item: StackItem): void {
		this.items.splice(this.items.indexOf(item), 1);
		this.items.unshift(item);
		item.setStage(0);
	}

	clear(): void {
		this.items.forEach((item) => item.deactivate);
		this.items = [];
		this.lookup = {};
	}
}
