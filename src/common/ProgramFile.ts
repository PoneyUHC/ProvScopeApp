/** Fetches a binary's symbol table (name -> link-time address). */
export type SymbolTableReader = (binaryPath: string) => Promise<Record<string, number>>;

/** A binary on disk: owns its symbol table and resolves symbol+offset to an address. */
export class ProgramFile {
    private symbolTable: Map<string, number>;

    private constructor(symbolTable: Map<string, number>) {
        this.symbolTable = symbolTable;
    }

    /**
     * Reads the binary's symbol table and returns a ready-to-use ProgramFile.
     * `readSymbolTable` runs `nm`, which only works in the main process; the
     * renderer passes `window.api.readSymbolTable` to reach it over IPC.
     */
    static async create(binaryPath: string, readSymbolTable: SymbolTableReader): Promise<ProgramFile> {
        const symbolTable = await readSymbolTable(binaryPath);
        return new ProgramFile(new Map(Object.entries(symbolTable)));
    }

    /** 'main+65' -> address(main) + 65. */
    getAddressFromSymbolOffset(symbolOffset: string): number {
        const idx = symbolOffset.lastIndexOf("+");
        const symbol = idx === -1 ? "" : symbolOffset.slice(0, idx);
        const offset = idx === -1 ? symbolOffset : symbolOffset.slice(idx + 1);
        if (!this.symbolTable.has(symbol)) {
            throw new Error(`symbol '${symbol}' not found in binary`);
        }
        return this.symbolTable.get(symbol)! + parseOffset(offset);
    }
}

// --- tiny parsing helpers ----------------------------------------------------

/** '30' -> 30 (decimal); '0x1e' -> 30 (hex). */
function parseOffset(text: string): number {
    return text.toLowerCase().startsWith("0x") ? parseInt(text, 16) : parseInt(text, 10);
}
