
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { TKEInstance } from "./TKEInstance";
import { TKEResult } from "./TKEResult";
import { TKESolverArguments, TKESolverOptions } from "./TKETypes";


export class TKESolver {
    private readonly javaExecutable: string
    private readonly jarPath: string
    private readonly workingDirectory: string
    private readonly tempRootDirectory: string
    private readonly instanceFileName: string
    private readonly outputFileName: string
    private readonly cleanupTemporaryFiles: boolean

    constructor(options: TKESolverOptions) {
        const workingDirectory = path.resolve(options.workingDirectory ?? process.cwd())

        this.javaExecutable = options.javaExecutable ?? "java"
        this.jarPath = this.resolveAgainstWorkingDirectory(options.jarPath, workingDirectory)
        this.workingDirectory = workingDirectory
        this.tempRootDirectory = this.resolveAgainstWorkingDirectory(options.tempRootDirectory ?? tmpdir(), workingDirectory)
        this.instanceFileName = options.instanceFileName ?? "instance.tke"
        this.outputFileName = options.outputFileName ?? "solution.txt"
        this.cleanupTemporaryFiles = options.cleanupTemporaryFiles ?? true
    }

    async solve(instance: TKEInstance, solverArguments: TKESolverArguments): Promise<TKEResult> {
        this.validateSolverArguments(solverArguments)

        const temporaryDirectory = await mkdtemp(path.join(this.tempRootDirectory, "tke-"))
        const instanceFilePath = path.join(temporaryDirectory, this.instanceFileName)
        const outputFilePath = path.join(temporaryDirectory, this.outputFileName)

        try {
            await writeFile(instanceFilePath, instance.toText(), "utf8")
            const args = this.buildArguments(instanceFilePath, outputFilePath, solverArguments)
            const command = Object.freeze([this.javaExecutable, ...args])
            const startedAt = Date.now()
            const processResult = await this.runJavaProcess(args)
            const output = await readFile(outputFilePath, "utf8")

            return new TKEResult(
                command,
                output,
                processResult.stdout,
                processResult.stderr,
                processResult.exitCode,
                processResult.signal,
                Date.now() - startedAt
            )
        }
        finally {
            if (this.cleanupTemporaryFiles) {
                await rm(temporaryDirectory, { recursive: true, force: true })
            }
        }
    }

    private buildArguments(
        instanceFilePath: string,
        outputFilePath: string,
        solverArguments: TKESolverArguments
    ): string[] {
        return [
            "-jar",
            this.jarPath,
            instanceFilePath,
            outputFilePath,
            String(solverArguments.nEpisodes),
            String(solverArguments.maxWindow),
        ]
    }

    private resolveAgainstWorkingDirectory(candidatePath: string, workingDirectory: string): string {
        if (path.isAbsolute(candidatePath)) {
            return candidatePath
        }

        return path.resolve(workingDirectory, candidatePath)
    }

    private runJavaProcess(args: string[]): Promise<{
        stdout: string
        stderr: string
        exitCode: number
        signal: NodeJS.Signals | null
    }> {
        return new Promise((resolve, reject) => {
            const child = spawn(this.javaExecutable, args, {
                cwd: this.workingDirectory,
                stdio: ["ignore", "pipe", "pipe"],
            })

            let stdout = ""
            let stderr = ""
            let settled = false

            child.stdout.setEncoding("utf8")
            child.stderr.setEncoding("utf8")

            child.stdout.on("data", (chunk: string) => {
                stdout += chunk
            })

            child.stderr.on("data", (chunk: string) => {
                stderr += chunk
            })

            child.once("error", (error) => {
                if (settled) {
                    return
                }

                settled = true
                reject(error)
            })

            child.once("close", (exitCode, signal) => {
                if (settled) {
                    return
                }

                settled = true
                resolve({
                    stdout,
                    stderr,
                    exitCode: exitCode ?? -1,
                    signal,
                })
            })
        })
    }

    private validateSolverArguments(solverArguments: TKESolverArguments): void {
        if (!Number.isInteger(solverArguments.nEpisodes) || solverArguments.nEpisodes <= 0) {
            throw new TypeError(`nEpisodes must be a positive integer, received ${solverArguments.nEpisodes}.`)
        }

        if (!Number.isInteger(solverArguments.maxWindow) || solverArguments.maxWindow < 0) {
            throw new TypeError(`maxWindow must be a non-negative integer, received ${solverArguments.maxWindow}.`)
        }
    }
}
