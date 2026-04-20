
import { TKEResult } from "./TKEResult";
import { TKEParsedResult } from "./TKETypes";


export class TKEResultParser {
    static parse(result: TKEResult): TKEParsedResult {
        return result.output
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => this.parseLine(line))
    }

    private static parseLine(line: string): TKEParsedResult[number] {
        const tokens = this.tokenize(line)
        const supportMarkerIndex = tokens.indexOf("#SUP:")
        if (supportMarkerIndex === -1) {
            throw new Error(`Invalid TKE result line: missing #SUP: marker in "${line}".`)
        }

        if (supportMarkerIndex === tokens.length - 1) {
            throw new Error(`Invalid TKE result line: missing support value in "${line}".`)
        }

        const supportValue = Number(tokens[supportMarkerIndex + 1])
        if (!Number.isInteger(supportValue)) {
            throw new Error(`Invalid TKE result line: support value must be an integer in "${line}".`)
        }

        const motifTokens = tokens.slice(0, supportMarkerIndex)
        const motif = this.parseMotifTokens(motifTokens, line)

        return {
            motif,
            n: supportValue,
        }
    }

    private static parseMotifTokens(tokens: string[], line: string): number[] {
        const motif: number[] = []

        for (const token of tokens) {
            if (token === "-1") {
                continue
            }

            const eventID = Number(token)
            if (!Number.isInteger(eventID)) {
                throw new Error(`Invalid TKE result line: motif token must be an integer in "${line}".`)
            }

            motif.push(eventID)
        }

        return motif
    }

    private static tokenize(line: string): string[] {
        const tokens: string[] = []
        let currentToken = ""

        for (const character of line) {
            if (character === " " || character === "\t") {
                if (currentToken.length > 0) {
                    tokens.push(currentToken)
                    currentToken = ""
                }

                continue
            }

            currentToken += character
        }

        if (currentToken.length > 0) {
            tokens.push(currentToken)
        }

        return tokens
    }
}
