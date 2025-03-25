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
    }
  }
}
