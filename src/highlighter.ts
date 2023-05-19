const MAX_STAGE = 5;

class StackItem<E extends HTMLElement> {
	private el: E;
	private _stage = 0;

	public get id(): string {
		return this.el.id;
	}

	private getClassName(): string {
		return `trail-step-${this.stage}`;
	}

	constructor(el: E) {
		this.el = el;
		// Set the setter directly
		this.stage = 0;
	}

	public get stage() {
		return this._stage;
	}

	public set stage(stage: number) {
		this.el.classList.remove(this.getClassName());
		if (stage < 0) {
			stage = 0;
		}
		this._stage = stage;
		this.el.classList.add(this.getClassName());
	}

	public tick() {
		if (this.stage > 0) {
			this.stage -= 1;
		}
	}

	public reset(): void {
		this.stage = 0;
	}
}

export class HighlightStack<E extends HTMLElement = HTMLElement> {
	private items: StackItem<E>[];
	private lookup: { [id: string]: StackItem<E> };

	constructor(nodes: NodeListOf<E>) {
		this.items = Array.from(nodes).map((node: E) => new StackItem(node));
		this.lookup = {};
		for (let item of this.items) {
			this.lookup[item.id] = item;
		}
	}

	public tick(): void {
		for (let item of this.items) {
			item.tick();
		}
	}

	public promote(el: E, tick = true): void {
		if (!el) {
			return;
		} else if (!(el instanceof HTMLElement)) {
			throw new Error("Invalid argument");
		}

		let item = this.lookup[el.id];
		if (!item) {
			throw new Error("Unknown element passed!");
		}

		if (tick) {
			this.tick();
		}
		item.stage = MAX_STAGE;
	}

	public reset(): void {
		for (let item of this.items) {
			item.reset();
		}
	}
}
