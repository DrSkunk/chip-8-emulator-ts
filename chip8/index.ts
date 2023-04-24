import { Memory } from "./Memory.ts";
import { Display } from "./Display.ts";
import { Stack } from "./Stack.ts";
import { Timer } from "./Timer.ts";

function hex(num: number) {
	return num.toString(16);
}

export class Chip8 {
	private memory: Memory;
	private display: Display;
	private programCounter: number;
	private indexRegister: number;
	private stack: Stack;
	private delayTimer: Timer;
	private soundTimer: Timer;
	private registers: Uint8Array;
	private keys: boolean[];

	private debug: boolean;

	constructor(debug = false) {
		this.display = new Display();
		this.memory = new Memory();
		this.programCounter = 0x200;
		this.indexRegister = 0;
		this.stack = new Stack();
		this.delayTimer = new Timer();
		this.soundTimer = new Timer();
		// 16 8-bit (one byte) general-purpose variable registers
		// numbered 0 through F hexadecimal, ie. 0 through 15 in decimal, called V0 through VF
		this.registers = new Uint8Array(16);
		this.keys = new Array(16).fill(false);

		this.debug = debug;
	}

	keyDown(key: number) {
		console.log("keyDown", key);
		this.keys[key] = true;
	}

	keyUp(key: number) {
		console.log("keyUp", key);
		this.keys[key] = false;
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
		// Decrement timers at 60Hz
		this.delayTimer.decrement();
		this.soundTimer.decrement();
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

		if (this.debug) {
			console.log("--------------------");
			console.log("instruction: " + hex(instruction));
			console.log("firstNibble: " + hex(firstNibble));
			console.log("x: " + hex(x));
			console.log("y: " + hex(y));
			console.log("n: " + hex(n));
			console.log("nn: " + hex(nn));
			console.log("nnn: " + hex(nnn));
			console.log("programCounter: " + hex(this.programCounter));
			console.log("indexRegister: " + hex(this.indexRegister));
			console.log("variableRegisters: " + this.registers);
		}

		let explanation = "unknown instruction";

		switch (firstNibble) {
			case 0x0000:
				// 00E0: Clear screen
				switch (instruction) {
					case 0x00E0:
						explanation = "0x00E0: Clear screen";
						this.display.clear();
						break;
					case 0x00EE:
						// 00EE: Return from subroutine
						explanation = "0x00EE: Return from subroutine";
						this.programCounter = this.stack.pop();
						break;
				}
				break;

			case 0x1000:
				// 1NNN: Jump
				// This instruction sets PC to NNN, causing the program to jump to that memory location.
				// Do not increment the PC afterwards, it jumps directly there.
				explanation = `0x1NNN: jump to ${hex(nnn)}`;
				this.programCounter = instruction & 0x0FFF;
				break;

			case 0x2000:
				// 2NNN: Call the subroutine at memory location NNN
				explanation = `0x2NNN: call subroutine at ${hex(nnn)}`;
				this.stack.push(this.programCounter);
				this.programCounter = nnn;
				break;
			case 0x3000:
				// 3XNN: Skip one instruction if the value in VX is equal to NN
				// But in this implementation we always increment the program counter by 2,
				// so we'll need to increment it by 2 to skip the next instruction for a total of 4.
				explanation = `0x3XNN: skip next instruction if register ${hex(x)} is equal to ${hex(nn)}`;
				if (this.registers[x] === nn) {
					this.programCounter += 2;
				}
				break;
			case 0x4000:
				// 4XNN: Skip one instruction if the value in VX is not equal to NN
				// Inverse of 3XNN with the same logic.
				explanation = `0x4XNN: skip next instruction if register ${hex(x)} is not equal to ${hex(nn)}`;
				if (this.registers[x] !== nn) {
					this.programCounter += 2;
				}
				break;
			case 0x5000:
				// 5XY0: Skip one instruction if the value in VX is equal to the value in VY
				// Same logic as 3XNN and 4XNN
				explanation = `0x5XY0: skip next instruction if register ${hex(x)} is equal to register ${hex(y)}`;
				if (this.registers[x] === this.registers[y]) {
					this.programCounter += 2;
				}
				break;
			case 0x6000:
				// 6XNN: Set
				// Set the register VX to the value NN.
				explanation = `0x6XNN: set register ${hex(x)} to ${hex(nn)}`;
				this.registers[x] = nn;
				break;

			case 0x7000:
				// 7XNN: Add
				// Add the value NN to VX.
				explanation = `0x7XNN: add ${hex(nn)} to register ${hex(x)}`;
				this.registers[x] += nn;
				break;

				// 8XYN: Arithmetic
			case 0x8000:
				switch (instruction & 0x000F) {
					case 0x0000:
						// 8XY0: Set
						// Set the register VX to the value of VY.
						explanation = `0x8XY0: set register ${hex(x)} to register ${hex(y)}`;
						this.registers[x] = this.registers[y];
						break;

					case 0x0001:
						// 8XY1: Bitwise OR
						// Set VX to VX OR VY.
						explanation = `0x8XY1: set register ${hex(x)} to register ${hex(x)} OR register ${hex(y)}`;
						this.registers[x] |= this.registers[x] | this.registers[y];
						break;

					case 0x0002:
						// 8XY2: Bitwise AND
						// Set VX to VX AND VY.
						explanation = `0x8XY2: set register ${hex(x)} to register ${hex(x)} AND register ${hex(y)}`;
						this.registers[x] &= this.registers[x] & this.registers[y];
						break;

					case 0x0003:
						// 8XY3: Bitwise XOR
						// Set VX to VX XOR VY.
						explanation = `0x8XY3: set register ${hex(x)} to register ${hex(x)} XOR register ${hex(y)}`;
						this.registers[x] = this.registers[x] ^ this.registers[y];
						break;

					case 0x0004:
						// 8XY4: Add
						// Add the value of VY to VX.
						this.registers[x] += this.registers[y];
						// Set VF to 1 if there is a carry, 0 otherwise.
						this.registers[0xF] = this.registers[x] > 0xFF ? 1 : 0;
						// Only keep the last byte of the result.
						this.registers[x] &= 0xFF;
						explanation = `0x8XY4: add register ${hex(y)} to register ${hex(x)}, setting VF to ${this.registers[0xF]}`;
						break;

					case 0x0005:
						// 8XY5: Set VX to the result of VX - VY.
						// Set VF to 0 if there is a borrow, 1 otherwise.
						this.registers[0xF] = this.registers[x] > this.registers[y] ? 1 : 0;
						this.registers[x] -= this.registers[y];
						explanation = `0x8XY5: subtract register ${hex(y)} from register ${hex(x)}, setting VF to ${this.registers[0xF]}`;
						break;

					case 0x0006:
						// 8XY6: Bitwise shift right
						// Set VX to the value of VY shifted right by one.

						// Set VF to the least significant bit of VY before the shift.
						this.registers[0xF] = this.registers[y] & 0x1;
						this.registers[x] = this.registers[y] >> 1;
						explanation = `0x8XY6: shift register ${hex(y)} right by one and store in register ${hex(x)}, setting VF to ${this.registers[0xF]}`;
						break;

					case 0x0007:
						// 8XY7: Set VX to the result of VY - VX.
						// Set VF to 0 if there is a borrow, 1 otherwise.
						this.registers[0xF] = this.registers[y] > this.registers[x] ? 1 : 0;
						this.registers[x] = this.registers[y] - this.registers[x];
						explanation = `0x8XY7: subtract register ${hex(x)} from register ${hex(y)}, setting VF to ${this.registers[0xF]}`;
						break;

					case 0x000E:
						// 8XYE: Bitwise shift left
						// Set VX to the value of VY shifted left by one.
						// Set VF to the most significant bit of VY before the shift.
						this.registers[0xF] = this.registers[y] >> 7;
						this.registers[x] = this.registers[y] << 1;
						explanation = `0x8XYE: shift register ${hex(y)} left by one and store in register ${hex(x)}, setting VF to ${this.registers[0xF]}`;
						break;
				}
				break;

			case 0x9000:
				// 9XY0: Skip one instruction if the value in VX is not equal to the value in VY
				// Inverse of 5XY0 with the same logic.
				explanation = `0x9XY0: skip next instruction if register ${hex(x)} is not equal to register ${hex(y)}`;
				if (this.registers[x] !== this.registers[y]) {
					this.programCounter += 2;
				}
				break;

			case 0xA000:
				// ANNN: Set index
				// This sets the index register I to the value NNN.
				explanation = `0xANNN: set index register to ${hex(nnn)}`;
				this.indexRegister = nnn;
				break;

			case 0xB000:
				// BNNN: Jump with offset
				// This sets the program counter to the value NNN plus the value in register 0.
				explanation = `0xBNNN: jump to ${hex(nnn)} plus register 0`;
				this.programCounter = nnn + this.registers[0];
				break;

			case 0xC000:
				// CXNN: Set VX to a random number with a mask
				// This sets the value of VX to a random number between 0 and 255, masked by the value NN.
				explanation = `0xCXNN: set register ${hex(x)} to random number masked by ${hex(nn)}`;
				this.registers[x] = Math.floor(Math.random() * 256) & nn;
				break;

			// deno-lint-ignore no-case-declarations
			case 0xD000:
				// DXYN: Display
				// This is the most involved instruction. It will draw an N pixels tall sprite from the memory locationthat the
				//  I index register is holding to the screen, at the horizontal X coordinate in VX and the Y coordinate in VY.
				// All the pixels that are “on” in the sprite will flip the pixels on the screen that it is drawn to (from left to
				// right, from most to least significant bit). If any pixels on the screen were turned “off” by this, the VF flag
				// register is set to 1. Otherwise, it’s set to 0.
				explanation = `0xDXYN: draw sprite at ${hex(x)}, ${hex(y)} with height ${hex(n)}`;

				// Set the X coordinate to the value in VX modulo 64 (or, equivalently, VX & 63, where & is the binary AND operation)
				const xCoordinate = this.registers[x] & 63;
				// Set the Y coordinate to the value in VY modulo 32 (or VY & 31)
				const yCoordinate = this.registers[y] & 31;
				// Set VF to 0
				this.registers[0xF] = 0;
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
								this.registers[0xF] = 1;
								this.display.setPixel(xCoordinate + j, yCoordinate + i, false);
							} else {
								this.display.setPixel(xCoordinate + j, yCoordinate + i, true);
							}
						}
					}
				}
				break;

			case 0xE000:
				switch (nn) {
					case 0x009E:
						// EX9E: Skip one instruction if the key in VX is pressed
						// This will skip the next instruction if the key in VX is pressed.
						explanation = `0xEX9E: skip next instruction if key in register ${hex(x)} is pressed`;
						if (this.keys[this.registers[x]]) {
							this.programCounter += 2;
						}
						break;
					case 0x00A1:
						// EXA1: Skip one instruction if the key in VX is not pressed
						// This will skip the next instruction if the key in VX is not pressed.
						explanation = `0xEXA1: skip next instruction if key in register ${hex(x)} is not pressed`;
						if (!this.keys[this.registers[x]]) {
							this.programCounter += 2;
						}
						break;
				}
				break;

			case 0xF000:
				switch (nn) {
					case 0x0007:
						// FX07: Set VX to the delay timer
						// This sets the value of VX to the value of the delay timer.
						explanation = `0xFX07: set register ${hex(x)} to delay timer`;
						this.registers[x] = this.delayTimer.getTimer();
						break;
					case 0x0015:
						// FX15: Set the delay timer to VX
						// This sets the value of the delay timer to the value of VX.
						explanation = `0xFX15: set delay timer to register ${hex(x)}`;
						this.delayTimer.setTimer(this.registers[x]);
						break;
					case 0x0018:
						// FX18: Set the sound timer to VX
						// This sets the value of the sound timer to the value of VX.
						explanation = `0xFX18: set sound timer to register ${hex(x)}`;
						break;
					case 0x001E:
						// FX1E: Add VX to the index register
						explanation = `0xFX1E: add register ${hex(x)} to index register`;
						this.indexRegister += this.registers[x];
						break;
					case 0x000A:
						// FX0A: Wait for a keypress and store it in VX
						explanation = `0xFX0A: wait for keypress and store it in register ${hex(x)}`;
						// For looping, decrement the PC by 2 so that the same instruction is executed again
						this.programCounter -= 2;
						// Loop through the keys array
						for (let i = 0; i < this.keys.length; i++) {
							// If the key is pressed, store its value in VX and break out of the loop
							if (this.keys[i]) {
								this.registers[x] = i;
								this.programCounter += 2;
								break;
							}
						}
						break;
					case 0x0029:
						// FX29: Set the index register to the location of the sprite for the character in VX
						explanation = `0xFX29: set index register to location of sprite for character in register ${hex(x)}`;
						this.indexRegister = this.memory.getFontCharAddress(this.registers[x]);
						break;

					case 0x0033:
						// FX33: Store the binary-coded decimal representation of VX at the addresses I, I+1, and I+2
						explanation = `0xFX33: store binary-coded decimal representation of register ${hex(x)} at addresses I, I+1, and I+2`;
						this.memory.setByte(this.indexRegister, Math.floor(this.registers[x] / 100));
						this.memory.setByte(this.indexRegister + 1, Math.floor((this.registers[x] % 100) / 10));
						this.memory.setByte(this.indexRegister + 2, this.registers[x] % 10);
						break;

					case 0x0055:
						// FX55: Store the values of registers V0 to VX inclusive in memory starting at address I
						explanation = `0xFX55: store values of registers V0 to register ${hex(x)} inclusive in memory starting at address I`;
						for (let i = 0; i <= x; i++) {
							this.memory.setByte(this.indexRegister + i, this.registers[i]);
						}
						break;

					case 0x0065:
						// FX65: Fill registers V0 to VX inclusive with the values stored in memory starting at address I
						explanation = `0xFX65: fill registers V0 to register ${hex(x)} inclusive with values stored in memory starting at address I`;
						for (let i = 0; i <= x; i++) {
							this.registers[i] = this.memory.getByte(this.indexRegister + i);
						}
						break;
				}
				break;
		}
		if (this.debug) {
			console.log(explanation);
		}
	}
}
