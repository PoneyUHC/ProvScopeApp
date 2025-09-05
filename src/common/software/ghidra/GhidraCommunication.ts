import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { BrowserWindow, ipcMain } from 'electron';
import WebSocket from 'ws';


export class GhidraCommunication {
    private url: string;
    private socket: WebSocket | null;
    private connected: boolean;
    private static instance: GhidraCommunication | null = null
    private bridge_process: ChildProcessWithoutNullStreams | null = null;
    private window: BrowserWindow | null = null;


    private constructor() {
        this.url = "ws://localhost:8765";
        this.socket = null;
        this.connected = false;

        ipcMain.on('open_ghidra', async (_event, message: string) => {
            this.launchPythonBridge();

            try {
                await this.sleep(100);
                this.connect();

                await this.sleep(100);
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.send(message);
                }
                else {
                    console.error("WebSocket is not open. Cannot send message.");
                }
            }
            catch (error) {
                console.error("Error during WebSocket communication:", error);
            }
        });

        ipcMain.on('ghidra_go_to_adress', (_event, address: string) => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.send(address);
            }
            else {
                console.error("WebSocket is not open. Cannot send address.");
            }
        });
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    launchPythonBridge() {
        if (this.bridge_process) {
            this.bridge_process.kill();
        }

        this.bridge_process = spawn('python3', ['src/scripts/ghidra/bridge.py']);

        this.bridge_process.stdout.on('data', (data) => {
            console.log(`${data}`);
        });

        this.bridge_process.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
    }

    stopPythonBridge() {
        if (this.bridge_process) {
            this.bridge_process.kill();
            this.bridge_process = null;
            this.connected = false;
        }
    }

    initWindow(window: BrowserWindow) {
        this.window = window;
    }

    static getInstance(): GhidraCommunication {
        if (GhidraCommunication.instance === null) {
            GhidraCommunication.instance = new GhidraCommunication()
        }
        return GhidraCommunication.instance
    }

    isConnected(): boolean {
        return this.connected;
    }

    connect(): void {
        this.socket = new WebSocket(this.url);

        this.socket.on('open', () => {
            console.log("Connected to the WebSocket \n")
            this.window?.webContents.send('ghidraConnectedStep1');
        });

        this.socket.on('message', (data: WebSocket.RawData) => {

            if (this.parseMessage(data)) {
                this.window?.webContents.send('ghidraConnectedStep2');
                this.connected = true;
            }
            else {
                this.window?.webContents.send('ghidraDisconnectedStep2');
                this.connected = false;
            }
        });
    }

    send(message: string) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        }
    }

    close() {
        if (this.socket) {
            this.socket.close();
        }
    }

    parseMessage(data: WebSocket.RawData): boolean {
        return (data.toString() === "connected");
    }
}