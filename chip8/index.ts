import { Memory } from "./Memory.ts";
import { Display } from "./Display.ts";
import { Stack } from "./Stack.ts";
import { Timer } from "./Timer.ts";

export class Chip8 {
	private memory: Memory;
	private display: Display;
	private programCounter: number;
	private indexRegister: number;
	private stack: Stack;
	private delayTimer: Timer;
	private soundTimer: Timer;
	private variableRegisters: Uint8Array;

	constructor() {
		this.display = new Display();
		this.memory = new Memory();
		this.programCounter = 0x200;
		this.indexRegister = 0;
		this.stack = new Stack();
		this.delayTimer = new Timer();
		this.soundTimer = new Timer();
		// 16 8-bit (one byte) general-purpose variable registers
		// numbered 0 through F hexadecimal, ie. 0 through 15 in decimal, called V0 through VF
		this.variableRegisters = new Uint8Array(16);
	}

	public loadRom(rom: Uint8Array): void {
		this.memory.loadRom(rom);
	}

	public getDisplay(): boolean[] {
		return this.display.getDisplay();
	}

	public step(): void {
		const instruction = this.fetch();
		this.decode(instruction);
	}

	private fetch(): number {
		// Read the instruction that PC is currently pointing at from memory.
		// An instruction is two bytes, so you will need to read two successive bytes from memory and combine them into one 16-bit instruction.

		// You should then immediately increment the PC by 2, to be ready to fetch the next opcode.
		const instruction = this.memory.getWord(this.programCounter);
		this.programCounter += 2;
		return instruction;
	}

	private decode(instruction: number): void {
		// Decode the instruction and execute it.
		// get first nibble
		const firstNibble = instruction & 0xF000;
		const x = (instruction & 0x0F00) >> 8;
		const y = (instruction & 0x00F0) >> 4;
		const n = instruction & 0x000F;
		const nn = instruction & 0x00FF;
		const nnn = instruction & 0x0FFF;

		console.log("instruction: " + instruction.toString(16));
		console.log("firstNibble: " + firstNibble.toString(16));
		console.log("x: " + x.toString(16));
		console.log("y: " + y.toString(16));
		console.log("n: " + n.toString(16));
		console.log("nn: " + nn.toString(16));
		console.log("nnn: " + nnn.toString(16));
		console.log("programCounter: " + this.programCounter.toString(16));
		console.log("indexRegister: " + this.indexRegister.toString(16));
		console.log("variableRegisters: " + this.variableRegisters);
		console.log("--------------------");
		// throw new Error("Not implemented");
		switch (firstNibble) {
			case 0x0000:
				// 00E0: Clear screen
				if (instruction === 0x00E0) {
					console.log("clearing screen");
					this.display.clear();
				}
				break;
			case 0x1000:
				console.log("jumping to " + nnn.toString(16));
				// 1NNN: Jump
				// This instruction sets PC to NNN, causing the program to jump to that memory location.
				// Do not increment the PC afterwards, it jumps directly there.
				this.programCounter = instruction & 0x0FFF;
				break;
				// 7XNN (add value to register VX)
				// ANNN (set index register I)
				// DXYN (display/draw)
			case 0x6000:
				console.log(
					"setting register " + x.toString(16) + " to " + nn.toString(16),
				);
				// 6XNN: Set
				// Set the register VX to the value NN.
				this.variableRegisters[x] = nn;
				break;
			case 0x7000:
				console.log(
					"adding " + nn.toString(16) + " to register " + x.toString(16),
				);
				// 7XNN: Add
				// Add the value NN to VX.
				this.variableRegisters[x] += nn;
				break;
			case 0xA000:
				console.log("setting index register to " + nnn.toString(16));
				// ANNN: Set index
				// This sets the index register I to the value NNN.
				this.indexRegister = nnn;
				break;
			// deno-lint-ignore no-case-declarations
			case 0xD000:
				console.log(
					"drawing sprite at " + x.toString(16) + ", " + y.toString(16) +
						" with height " + n.toString(16),
				);
				// DXYN: Display
				// This is the most involved instruction. It will draw an N pixels tall sprite from the memory location that the I index register is holding to the screen, at the horizontal X coordinate in VX and the Y coordinate in VY. All the pixels that are “on” in the sprite will flip the pixels on the screen that it is drawn to (from left to right, from most to least significant bit). If any pixels on the screen were turned “off” by this, the VF flag register is set to 1. Otherwise, it’s set to 0.

				// Set the X coordinate to the value in VX modulo 64 (or, equivalently, VX & 63, where & is the binary AND operation)
				const xCoordinate = this.variableRegisters[x] & 63;
				// Set the Y coordinate to the value in VY modulo 32 (or VY & 31)
				const yCoordinate = this.variableRegisters[y] & 31;
				// Set VF to 0
				this.variableRegisters[0xF] = 0;
				// For N rows:
				//     Get the Nth byte of sprite data, counting from the memory address in the I register (I is not incremented)
				//     For each of the 8 pixels/bits in this sprite row (from left to right, ie. from most to least significant bit):
				//         If the current pixel in the sprite row is on and the pixel at coordinates X,Y on the screen is also on, turn off the pixel and set VF to 1
				//         Or if the current pixel in the sprite row is on and the screen pixel is not, draw the pixel at the X and Y coordinates
				//         If you reach the right edge of the screen, stop drawing this row
				//         Increment X (VX is not incremented)
				//     Increment Y (VY is not incremented)
				//     Stop if you reach the bottom edge of the screen
				for (let i = 0; i < n; i++) {
					const spriteRow = this.memory.getByte(this.indexRegister + i);
					for (let j = 0; j < 8; j++) {
						const pixel = (spriteRow >> (7 - j)) & 1;
						if (pixel === 1) {
							const screenPixel = this.display.getPixel(
								xCoordinate + j,
								yCoordinate + i,
							);
							if (screenPixel) {
								this.variableRegisters[0xF] = 1;
								this.display.setPixel(xCoordinate + j, yCoordinate + i, false);
							} else {
								this.display.setPixel(xCoordinate + j, yCoordinate + i, true);
							}
						}
					}
				}
		}
	}
}
