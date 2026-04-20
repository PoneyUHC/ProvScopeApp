
export interface TKESolverArguments {
    nEpisodes: number
    maxWindow: number
}

export type TKEParsedResult = {
    motif: number[]
    n: number
}[]

export interface TKESolverOptions {
    javaExecutable?: string
    jarPath: string
    workingDirectory?: string
    tempRootDirectory?: string
    instanceFileName?: string
    outputFileName?: string
    cleanupTemporaryFiles?: boolean
}
