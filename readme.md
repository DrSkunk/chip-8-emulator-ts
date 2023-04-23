# CHIP-8 emulator

This is a CHIP-8 emulator written in typescript using Deno. It uses the SDL2
library for graphics and audio. It follows the tutorial at
https://tobiasvl.github.io/blog/write-a-chip-8-emulator/#memory

## Setup

You need to have SDL2 installed on your system. See
https://deno.land/x/sdl2@0.6.0#installing-sdl2

## Running

To run the emulator, put a rom in the `roms` folder and adjust the line in
`main.ts` where it loads it from the filesystem. Then run the following command:

```bash
deno task start
```
