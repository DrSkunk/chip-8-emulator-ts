import { Display } from "./chip8/Display.ts";
import { Chip8 } from "./chip8/index.ts";
import { EventType, WindowBuilder } from "https://deno.land/x/sdl2@0.6.0/mod.ts";

const DEBUG = false;

const width = Display.WIDTH * 10;
const height = Display.HEIGHT * 10;

const screen = new WindowBuilder("CHIP-8 emulator", width, height).build();
const canvas = screen.canvas();

const FPS = () => {
	let start = performance.now();
	let frames = 0;
	return () => {
		frames++;
		// setTimeout is blocked by the event loop.
		if ((performance.now() - start) >= 1000) {
			start = performance.now();
			console.log(`FPS: ${frames}`);
			frames = 0;
		}
	};
};

const stepFrame = FPS();

const chip8 = new Chip8(DEBUG);
const rom = await Deno.readFile("./roms/breakout.ch8");
chip8.loadRom(rom);

// deno-lint-ignore require-await
async function draw() {
	canvas.setDrawColor(0, 0, 0, 255);
	// Clear the screen
	canvas.clear();
	// Draw a point
	canvas.setDrawColor(255, 255, 255, 255);

	for (let i = 0; i < chip8.getDisplay().length; i++) {
		const element = chip8.getDisplay()[i];
		if (element) {
			const x = i % Display.WIDTH * 10;
			const y = Math.floor(i / Display.WIDTH) * 10;
			canvas.fillRect(x, y, 10, 10);
		}
	}
	canvas.present();
	// stepFrame();
}

let lastStepTimeStamp = Date.now();

const keymap: { [key: number]: number } = {
	30: 0x1,
	31: 0x2,
	32: 0x3,
	33: 0x4,
	34: 0x5,
	35: 0x6,
	36: 0x7,
	37: 0x8,
	38: 0x9,
	39: 0x0,
	20: 0xa, // A
	26: 0xb, // Z
	8: 0xc, // E
	21: 0xd, // R
	23: 0xe, // T
	28: 0xf, // Y
};

for (const event of screen.events()) {
	// update chip8 every 1/60th of a second
	if (!DEBUG && Date.now() - lastStepTimeStamp > 1000 / 60) {
		chip8.step();
		lastStepTimeStamp = Date.now();
	}
	const key = keymap?.[event?.keysym?.scancode];

	switch (event.type) {
		// deno-lint-ignore no-fallthrough
		case EventType.Quit:
			Deno.exit();
		case EventType.Draw:
			draw();
			break;
		case EventType.KeyDown:
			if (DEBUG && event.keysym.scancode === 44) {
				chip8.step();
			}
			if (key !== undefined) {
				chip8.keyDown(key);
			}

			break;
		case EventType.KeyUp:
			if (key !== undefined) {
				chip8.keyUp(key);
			}
			break;
	}
}
