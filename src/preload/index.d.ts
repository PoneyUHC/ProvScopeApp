
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
