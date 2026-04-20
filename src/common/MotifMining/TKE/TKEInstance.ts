
export class TKEInstance {
    readonly entries: ReadonlyArray<number>

    constructor(entries: readonly number[]) {
        this.entries = Object.freeze(
            entries.map((entry) => {
                if (!Number.isInteger(entry)) {
                    throw new TypeError(`TKEInstance entries must be integers, received ${entry}.`)
                }

                return entry
            })
        )
    }

    toText(): string {
        return this.entries.join("\n")
    }

    toJSON(): string {
        return JSON.stringify(this.entries)
    }
}
