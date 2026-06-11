/**
 * Resolve bpftrace ustack 'symbol+offset' strings to on-disk binary addresses.
 *
 *   const program  = new ProgramFile("/path/to/closetest");
 *   const chunk    = UStackToCallsite.getUserSymbolOffset(ustack); // "close_in_helper+30"
 *   const addr     = program.getAddressFromSymbolOffset(chunk);      // 0x12b3
 */


/** Parse a bpftrace ustack down to its first user-code call site. */
export class UStackToCallsite {
  /** First frame outside a shared library = the call site in user code. */
  static getUserSymbolOffset(ustack: string): string | null {
    for (const frame of ustack.trim().split("\n")) {
      if (frame.trim() && !isLibraryFrame(frame)) {
        return symbolOffsetOfFrame(frame);
      }
    }
    return null;
  }
}

// --- reading one exported ustack frame ---------------------------------------

function isLibraryFrame(frame: string): boolean {
  return moduleOfFrame(frame).includes(".so");
}

/** The path inside the parentheses, e.g. '/usr/.../libc.so.6'. */
function moduleOfFrame(frame: string): string {
  return frame.slice(frame.lastIndexOf("(") + 1, frame.lastIndexOf(")"));
}

/** The 'symbol+offset' token, e.g. 'close_in_helper+30'. */
function symbolOffsetOfFrame(frame: string): string {
  const addressAndSymbol = frame.slice(0, frame.lastIndexOf("(")).split(/\s+/).filter(Boolean);
  return addressAndSymbol[1];
}