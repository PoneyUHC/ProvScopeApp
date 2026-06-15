
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
    interface Window {
        electron: ElectronAPI
        api : {
            onLoadTrace: (callback: (filename: string, content: string) => void) => void,
            offLoadTrace: (callback: (filename: string, content: string) => void) => void,
            onRequestExportTrace: (callback: () => void) => void,
            offRequestExportTrace: (callback: () => void) => void,
            offAll: () => void,
            exportTrace: (filename: string, content: string) => void,

            selectBinaryFile: () => Promise<string | null>,
            readSymbolTable: (binaryPath: string) => Promise<Record<string, number>>,

            sendClick: (message: string) => void,
            sendGClick: (address: string) => void,
            
            onGhidraIsConnected1: (callback: () => void) => void,
            offGhidraIsConnected1: (callback: () => void) => void,
            onGhidraIsDisconnected1: (callback: () => void) => void,
            offGhidraIsDisconnected1: (callback: () => void) => void,

            onGhidraIsConnected2: (callback: () => void) => void,
            offGhidraIsConnected2: (callback: () => void) => void,
            onGhidraIsDisconnected2: (callback: () => void) => void,
            offGhidraIsDisconnected2: (callback: () => void) => void,
        }
    }
}
