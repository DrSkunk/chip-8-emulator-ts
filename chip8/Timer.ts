export class Timer {
	private timer: number;

	constructor(initialValue: number = 0) {
		this.timer = initialValue;
	}

	public getTimer(): number {
		return this.timer;
	}

	public setTimer(value: number): void {
		this.timer = value;
	}

	public decrement(): void {
		if (this.timer > 0) {
			this.timer--;
		}
	}
}
