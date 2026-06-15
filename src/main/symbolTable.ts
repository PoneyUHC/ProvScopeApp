import { dialog, ipcMain } from "electron";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Registers the main-process IPC handlers backing the binary-resolution
 * feature: picking a binary file and reading its symbol table. Both rely on
 * Electron / `child_process` APIs that are unavailable in the (context-isolated)
 * renderer.
 */
export function registerSymbolTableHandler(): void {

    // Opens a single-file picker and returns the chosen path, or null if cancelled.
    ipcMain.handle("selectBinaryFile", async (): Promise<string | null> => {
        const result = await dialog.showOpenDialog({
            title: "Select binary file",
            message: "Select the binary file for this process",
            properties: ["openFile"],
        });
        return result.canceled ? null : result.filePaths[0];
    });

    // Reads a binary's symbol table with `nm`: symbol name -> link-time address.
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
