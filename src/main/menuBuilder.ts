
import { BrowserWindow, dialog, ipcMain, Menu } from "electron";

import { spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";


async function loadTrace(window: BrowserWindow) {

    dialog.showOpenDialog({

        properties: ['openFile', 'multiSelections'],
        message: 'Select one or multiple trace file(s)',

    }).then((result) => {

        if ( ! result.canceled ) {
            for (const filename of result.filePaths) {
                const content = readFileSync(filename, 'utf-8')
                window.webContents.send('loadTrace', filename, content)
            }
        }
    }).catch((err) => {

        console.error(err)

    })
}


async function requestExportTrace(window: BrowserWindow) {

    window.webContents.send('requestExportTrace')

}


const doLCS = (directory: string) => {

    const pythonProcess = spawnSync('python3', [
        './src/common/src/lcs/lcs.py',
        directory
    ]);

    const lcs = pythonProcess.stdout.toString()
    console.log(lcs)
}

async function handleLCS() {

    dialog.showOpenDialog({

        properties: ['openDirectory'],
        message: 'Select traces files',

    }).then((result) => {

        if ( ! result.canceled ) {
            const directory = result.filePaths[0]
            doLCS(directory)
        }
    }).catch((err) => {

        console.error(err)

    })

}


async function exportTrace(defaultFilename: string, content: string) {

    dialog.showSaveDialog({

        title: 'Export trace',
        message: 'Select a file to save the trace',
        defaultPath: defaultFilename,

    }).then((result) => {
            
        if ( ! result.canceled ) {
            const filename = result.filePath
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
                },
                {
                    label: 'Longuest common subsequence (LCS)',
                    accelerator: process.platform == 'darwin' ? 'Cmd+L' : 'Ctrl+L',
                    click: () => { handleLCS() }
                }
            ]
        }
    ]

    return Menu.buildFromTemplate(menuTemplate)
}


export default getMenu;
