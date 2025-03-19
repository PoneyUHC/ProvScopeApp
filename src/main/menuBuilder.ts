
import { IPCTrace } from "../common/src/types";
import { BrowserWindow, dialog, Menu } from "electron";
import { readFileSync } from "fs";


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


function getMenu(window: BrowserWindow) {

    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Load trace',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => { loadTrace(window) }
                }, 
                {
                    label: 'Export trace',
                    click: async () => {
                        console.log("Export trace")
                    }
                }
            ]
        }
    ]

    return Menu.buildFromTemplate(menuTemplate)
}


export default getMenu;
