
import { IPCTraceGraph } from "../common/src/IPCTraceGraph";
import { BrowserWindow, dialog, ipcMain, Menu } from "electron";
import { readFileSync, writeFileSync } from "fs";


async function loadTrace(window: BrowserWindow) {

    dialog.showOpenDialog({

        properties: ['openFile'],
        message: 'Select a trace file',

    }).then((result) => {

        if ( ! result.canceled ) {
            const filename = result.filePaths[0]
            const content = readFileSync(filename, 'utf-8')
            window.webContents.send('loadTrace', filename, content)
        }
    }).catch((err) => {

        console.error(err)

    })
}


async function requestExportTrace(window: BrowserWindow) {

    console.log("request")
    window.webContents.send('requestExportTrace')
}


async function exportTrace(defaultFilename: string, content: string) {

    dialog.showSaveDialog({

        title: 'Export trace',
        message: 'Select a file to save the trace',
        defaultPath: defaultFilename,

    }).then((result) => {
            
        if ( ! result.canceled ) {
            const filename = result.filePath
            console.log(filename)
            console.log(content)
            writeFileSync(filename, content)
        }

    }).catch((err) => {

        console.error(err)

    })
}


ipcMain.on('exportTrace', (_event, defaultFilename, content) => { exportTrace(defaultFilename, content) })


function getMenu(window: BrowserWindow) {

    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Load trace',
                    accelerator: process.platform == 'darwin' ? 'Cmd+O' : 'Ctrl+O',
                    click: () => { loadTrace(window) }
                }, 
                {
                    label: 'Export trace',
                    accelerator: process.platform == 'darwin' ? 'Cmd+S' : 'Ctrl+S',
                    click: () => { 
                        requestExportTrace(window)
                    }
                }
            ]
        }
    ]

    return Menu.buildFromTemplate(menuTemplate)
}


export default getMenu;
