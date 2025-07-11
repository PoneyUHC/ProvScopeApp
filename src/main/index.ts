
import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { GhidraCommunication } from "../common/src/software/ghidra/GhidraCommunication";

import getMenu from './menuBuilder'
import goldoIcon from '../common/src/assets/goldo_icon.png?asset'

export let ghidraCommunication: GhidraCommunication | null = null 

function createWindow(): void {

    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: true,
        icon: goldoIcon,
        autoHideMenuBar: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    mainWindow.once('ready-to-show', () => {
        const menu = getMenu(mainWindow)
        Menu.setApplicationMenu(menu)
        mainWindow.maximize()
        mainWindow.focus()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}


app.whenReady().then(() => {

    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    ghidraCommunication = GhidraCommunication.getInstance()
    setTimeout(() => { ghidraCommunication!.send("00101200") }, 1000);
})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
