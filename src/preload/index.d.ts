import { ElectronAPI } from '@electron-toolkit/preload'
import { GhidraCommunication } from '../common/src/software/ghidra/GhidraCommunication'

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
        ghidra: {
            isConnected: () => boolean
        }
        onGhidraIsConnected: (callback: () => void) => void,
        offGhidraIsConnected: (callback: () => void) => void,
        onGhidraIsDisconnected: (callback: () => void) => void,
        offGhidraIsDisconnected: (callback: () => void) => void,
    }
  }
}
