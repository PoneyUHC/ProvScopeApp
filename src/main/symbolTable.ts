import { ipcMain } from "electron";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Reads a binary's symbol table with `nm`, returning symbol name -> link-time
 * address. Runs in the main process because `child_process` is unavailable in
 * the (context-isolated) renderer. Exposed to the renderer via the
 * 'readSymbolTable' IPC channel.
 */
export function registerSymbolTableHandler(): void {
    ipcMain.handle("readSymbolTable", async (_event, binaryPath: string) => {
        const { stdout } = await execFileAsync("nm", [binaryPath], { encoding: "utf8" });
        const symbolTable: Record<string, number> = {};
        for (const line of stdout.split("\n")) {
            const parsed = parseNmLine(line);
            if (parsed && !(parsed[0] in symbolTable)) {
                symbolTable[parsed[0]] = parsed[1];
            }
        }
        return symbolTable;
    });
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

function isHex(text: string): boolean {
    return /^[0-9a-fA-F]+$/.test(text);
}
