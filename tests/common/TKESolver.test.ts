import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { TKEInstance } from "@common/MotifMining/TKE/TKEInstance";
import { TKEResult } from "@common/MotifMining/TKE/TKEResult";
import { TKEResultParser } from "@common/MotifMining/TKE/TKEResultParser";
import { TKESolver } from "@common/MotifMining/TKE/TKESolver";

describe("TKEInstance", () => {
    it("stores an ordered list of numeric event IDs", () => {
        const instance = new TKEInstance([101, 202, 303])

        expect(instance.entries).toEqual([101, 202, 303])
    })

    it("rejects non-integer entries", () => {
        const instanceFactory = () => new TKEInstance([1, 3.14])

        expect(instanceFactory).toThrow(/entries must be integers/i)
    })
})


describe("TKESolver", () => {
    it("runs asynchronously and reads the solver output file", async () => {
        const instance = new TKEInstance([5, 7])

        const tempDirectory = await mkdtemp(path.join(tmpdir(), "tke-test-"))
        const fakeJavaPath = path.join(tempDirectory, "fake-java.sh")
        const fakeJarPath = path.join(tempDirectory, "fake.jar")

        await writeFile(
            fakeJavaPath,
            [
                "#!/usr/bin/env bash",
                "shift",
                "jar_path=\"$1\"",
                "instance_path=\"$2\"",
                "output_path=\"$3\"",
                "n_episodes=\"$4\"",
                "max_window=\"$5\"",
                "input_content=\"$(cat \"$instance_path\")\"",
                "printf 'jar=%s\\ncount=%s\\nwindow=%s\\ninput=%s' \"$jar_path\" \"$n_episodes\" \"$max_window\" \"$input_content\" > \"$output_path\"",
                "printf 'solver-ran'",
            ].join("\n"),
            "utf8"
        )
        await chmod(fakeJavaPath, 0o755)
        await writeFile(fakeJarPath, "", "utf8")

        const solver = new TKESolver({
            javaExecutable: fakeJavaPath,
            jarPath: fakeJarPath,
        })

        const result = await solver.solve(instance, {
            nEpisodes: 3,
            maxWindow: 12,
        })

        expect(result.isSuccess).toBe(true)
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toBe("solver-ran")
        expect(result.output).toContain(`jar=${fakeJarPath}`)
        expect(result.output).toContain("count=3")
        expect(result.output).toContain("window=12")
        expect(result.output).toContain(`input=${instance.toText()}`)
        expect(result.command[0]).toBe(fakeJavaPath)
        expect(result.command.slice(1)).toEqual([
            "-jar",
            fakeJarPath,
            expect.any(String),
            expect.any(String),
            "3",
            "12",
        ])
    })

    it("rejects invalid solver arguments", async () => {
        const solver = new TKESolver({
            jarPath: "/tmp/fake.jar",
        })

        await expect(solver.solve(new TKEInstance([1]), {
            nEpisodes: 0,
            maxWindow: -1,
        })).rejects.toThrow(/nEpisodes/i)
    })
})


describe("TKEResultParser", () => {
    it("parses all motifs from multiline solver output without regex", () => {
        const result = new TKEResult(
            [],
            [
                "1 -1 #SUP: 2",
                "1 -1 2 -1 #SUP: 2",
                "1 -1 1 -1 #SUP: 2",
                "2 -1 #SUP: 3",
                "1 -1 1 -1 #SUP: 4",
                "1 -1 #SUP: 5",
            ].join("\n"),
            "",
            "",
            0,
            null,
            0
        )

        expect(TKEResultParser.parse(result)).toEqual([
            { motif: [1], n: 2 },
            { motif: [1, 2], n: 2 },
            { motif: [1, 1], n: 2 },
            { motif: [2], n: 3 },
            { motif: [1, 1], n: 4 },
            { motif: [1], n: 5 },
        ])
    })
})
