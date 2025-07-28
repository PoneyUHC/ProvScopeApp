
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'


const api = {
    onLoadTrace: (callback: (filename: string, content: string) => void) => ipcRenderer.on('loadTrace', (_event, filename:  string, content: string) => callback(filename, content)),
    offLoadTrace: (callback: (filename: string, content: string) => void) => ipcRenderer.off('loadTrace', (_event, filename:  string, content: string) => callback(filename, content)),
    onRequestExportTrace: (callback: () => void) => ipcRenderer.on('requestExportTrace', callback),
    offRequestExportTrace: (callback: () => void) => ipcRenderer.off('requestExportTrace', callback),
    offAll: () => ipcRenderer.removeAllListeners(),
    exportTrace: (filename: string, content: string) => ipcRenderer.send('exportTrace', filename, content),

    sendClick: (message: string) => ipcRenderer.send('open_ghidra', message),
    sendGClick: (address: string) => ipcRenderer.send('ghidra_go_to_adress', address),

    onGhidraIsConnected1: (callback: () => void) => ipcRenderer.on('ghidraConnectedStep1', (_event) => callback()), // webSocket connexion 
    offGhidraIsConnected1: (callback: () => void) => ipcRenderer.off('ghidraConnectedStep1', (_event) => callback()),
    onGhidraIsDisconnected1: (callback: () => void) => ipcRenderer.on('ghidraDisconnectedStep1', (_event) => callback()),
    offGhidraIsDisconnected1: (callback: () => void) => ipcRenderer.off('ghidraDisconnectedStep1', (_event) => callback()),

    onGhidraIsConnected2: (callback: () => void) => ipcRenderer.on('ghidraConnectedStep2', (_event) => callback()), // ghidraBridge connexion
    offGhidraIsConnected2: (callback: () => void) => ipcRenderer.off('ghidraConnectedStep2', (_event) => callback()),
    onGhidraIsDisconnected2: (callback: () => void) => ipcRenderer.on('ghidraDisconnectedStep2', (_event) => callback()),
    offGhidraIsDisconnected2: (callback: () => void) => ipcRenderer.off('ghidraDisconnectedStep2', (_event) => callback()),
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
