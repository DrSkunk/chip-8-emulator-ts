import { Display } from "./chip8/Display.ts";
import { Chip8 } from "./chip8/index.ts";
import {
	EventType,
	WindowBuilder,
} from "https://deno.land/x/sdl2@0.6.0/mod.ts";

const width = Display.WIDTH * 10;
const height = Display.HEIGHT * 10;

const window = new WindowBuilder("CHIP-8 emulator", width, height).build();
const canvas = window.canvas();

const chip8 = new Chip8();
const rom = await Deno.readFile("./roms/IBM Logo.ch8");
chip8.loadRom(rom);

function draw() {
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
}

let lastStepTimeStamp = Date.now();

for (const event of window.events()) {
	// update chip8 every 1/60th of a second
	if (Date.now() - lastStepTimeStamp > 1000 / 60) {
		chip8.step();
		lastStepTimeStamp = Date.now();
	}

	if (event.type == EventType.Quit) {
		break;
	} else if (event.type == EventType.Draw) {
		draw();
	}
}
