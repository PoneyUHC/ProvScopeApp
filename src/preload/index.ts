import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { GhidraCommunication } from '../common/src/software/ghidra/GhidraCommunication'

// Custom APIs for renderer
const api = {
    onLoadTrace: (callback: (filename: string, content: string) => void) => ipcRenderer.on('loadTrace', (_event, filename:  string, content: string) => callback(filename, content)),
    offLoadTrace: (callback: (filename: string, content: string) => void) => ipcRenderer.off('loadTrace', (_event, filename:  string, content: string) => callback(filename, content)),
    onRequestExportTrace: (callback: () => void) => ipcRenderer.on('requestExportTrace', callback),
    offRequestExportTrace: (callback: () => void) => ipcRenderer.off('requestExportTrace', callback),
    offAll: () => ipcRenderer.removeAllListeners(),
    exportTrace: (filename: string, content: string) => ipcRenderer.send('exportTrace', filename, content),
    ghidra: GhidraCommunication.api,
    onGhidraIsConnected: (callback: () => void) => ipcRenderer.on('ghidraConnected', callback),
    offGhidraIsConnected: (callback: () => void) => ipcRenderer.off('ghidraConnected', callback),
    onGhidraIsDisconnected: (callback: () => void) => ipcRenderer.on('ghidraDisconnected', callback),
    offGhidraIsDisconnected: (callback: () => void) => ipcRenderer.off('ghidraDisconnected', callback),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
