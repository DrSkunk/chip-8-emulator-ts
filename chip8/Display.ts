// The display is 64 pixels wide and 32 pixels tall.
// A pixel can be either on or off.

export class Display {
	private display: boolean[];

	public static WIDTH = 64;
	public static HEIGHT = 32;

	constructor() {
		this.display = new Array(Display.WIDTH * Display.HEIGHT).fill(false);
	}

	public getDisplay(): boolean[] {
		return this.display;
	}

	public getPixel(x: number, y: number): boolean {
		return this.display[(y * Display.WIDTH) + x];
	}

	public setPixel(x: number, y: number, value: boolean): void {
		if (x >= Display.WIDTH || y >= Display.HEIGHT) {
			console.warn(`Pixel out of bounds: X:${x}, Y:${y}`);
			return;
		}
		this.display[(y * Display.WIDTH) + x] = value;
	}

	public clear(): void {
		this.display = new Array(Display.WIDTH * Display.HEIGHT).fill(false);
	}
}
