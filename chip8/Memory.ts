// 4096 bytes of memory
// 0050–009F - Font set
// 0200–FFFF - Program ROM and work RAM

// deno-fmt-ignore
const fontset = [
	0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
	0x20, 0x60, 0x20, 0x20, 0x70, // 1
	0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
	0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
	0x90, 0x90, 0xF0, 0x10, 0x10, // 4
	0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
	0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
	0xF0, 0x10, 0x20, 0x40, 0x40, // 7
	0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
	0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
	0xF0, 0x90, 0xF0, 0x90, 0x90, // A
	0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
	0xF0, 0x80, 0x80, 0x80, 0xF0, // C
	0xE0, 0x90, 0x90, 0x90, 0xE0, // D
	0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
	0xF0, 0x80, 0xF0, 0x80, 0x80, // F
];

export class Memory {
	private memory: Uint8Array;

	constructor() {
		this.memory = new Uint8Array(4096);

		// Load fontset into 050–09F
		for (let i = 0; i < fontset.length; i++) {
			this.memory[i + 0x050] = fontset[i];
		}
	}

	public getMemory(): Uint8Array {
		return this.memory;
	}

	public getByte(address: number): number {
		return this.memory[address];
	}

	public setByte(address: number, value: number): void {
		this.memory[address] = value;
	}

	public getWord(address: number): number {
		return (this.memory[address] << 8) | this.memory[address + 1];
	}

	public loadRom(rom: Uint8Array): void {
		// Load rom into 0200–FFFF
		for (let i = 0; i < rom.length; i++) {
			this.memory[i + 0x200] = rom[i];
		}
	}

	public getFontCharAddress(fontChar: number): number {
		// Fontset is loaded into 050–09F
		// Each char is 5 bytes long
		return 0x050 + fontChar * 5;
	}
}
