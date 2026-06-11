import { execFileSync } from "child_process";

/** A binary on disk: owns its symbol table and resolves symbol+offset to an address. */
export class ProgramFile {
  private symbolTable: Map<string, number>;

  constructor(binaryPath: string) {
    this.symbolTable = readSymbolTable(binaryPath);
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

// --- reading the binary's symbol table ---------------------------------------

/** Map each symbol name to its link-time address, using `nm`. */
function readSymbolTable(binaryPath: string): Map<string, number> {
  const nmOutput = execFileSync("nm", [binaryPath], { encoding: "utf8" });
  const symbolTable = new Map<string, number>();
  for (const line of nmOutput.split("\n")) {
    const parsed = parseNmLine(line);
    if (parsed && !symbolTable.has(parsed[0])) {
      symbolTable.set(parsed[0], parsed[1]);
    }
  }
  return symbolTable;
}

/**
 * '0000000000001295 t close_in_helper' -> ['close_in_helper', 0x1295].
 * Returns null for undefined symbols, which have no address.
 */
function parseNmLine(line: string): [string, number] | null {
  const parts = line.split(/\s+/).filter(Boolean);
  if (parts.length === 3 && isHex(parts[0])) {
    const [address, , name] = parts;
    return [name, parseInt(address, 16)];
  }
  return null;
}


// --- tiny parsing helpers ----------------------------------------------------

/** '30' -> 30 (decimal); '0x1e' -> 30 (hex). */
function parseOffset(text: string): number {
  return text.toLowerCase().startsWith("0x") ? parseInt(text, 16) : parseInt(text, 10);
}

function isHex(text: string): boolean {
  return /^[0-9a-fA-F]+$/.test(text);
}
