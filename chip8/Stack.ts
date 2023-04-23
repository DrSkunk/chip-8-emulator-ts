export class Stack {
	private stack: number[];

	constructor() {
		this.stack = [];
	}

	public getStack(): number[] {
		return this.stack;
	}

	public getTop(): number {
		return this.stack[this.stack.length - 1];
	}

	public push(value: number): void {
		this.stack.push(value);
	}

	public pop(): number {
		const element = this.stack.pop();
		if (element === undefined) {
			throw new Error("Stack is empty");
		}
		return element;
	}
}
