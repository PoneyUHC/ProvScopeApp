
export class TKEResult {
    readonly command: readonly string[]
    readonly output: string
    readonly stdout: string
    readonly stderr: string
    readonly exitCode: number
    readonly signal: NodeJS.Signals | null
    readonly durationMs: number

    constructor(
        command: readonly string[],
        output: string,
        stdout: string,
        stderr: string,
        exitCode: number,
        signal: NodeJS.Signals | null,
        durationMs: number
    ) {
        this.command = Object.freeze([...command])
        this.output = output
        this.stdout = stdout
        this.stderr = stderr
        this.exitCode = exitCode
        this.signal = signal
        this.durationMs = durationMs
    }

    get isSuccess(): boolean {
        return this.exitCode === 0
    }
}
