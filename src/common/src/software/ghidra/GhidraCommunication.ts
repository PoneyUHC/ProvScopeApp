import { ipcMain } from 'electron';
import WebSocket from 'ws';


export class GhidraCommunication {
    private url: string;
    private socket: WebSocket | null;
    private connected: boolean;
    private static instance: GhidraCommunication | null = null
    static api = {
        isConnected: () => GhidraCommunication.getInstance().isConnected(),
    }

    private constructor() {
        this.url = "ws://localhost:8765";
        this.socket = null;
        this.connected = false;

        this.connect();
    }

    static getInstance(): GhidraCommunication {
        if( GhidraCommunication.instance === null ) {
            GhidraCommunication.instance = new GhidraCommunication()
        }

        return GhidraCommunication.instance
    }

    isConnected(): boolean {
        return this.connected;
    }

    private connect(): void {
        this.socket = new WebSocket(this.url);

        this.socket.on('open', () => { console.log("Connected to the WebSocket \n") });

        this.socket.on('message', (data: WebSocket.RawData) => {
            const message = data.toString();
            console.log("Message received from the WebSocket server : ", message);
            if (this.parseMessage(message)) {
                ipcMain.emit("ghidraConnected")
                this.connected = true;
            }
            else{
                ipcMain.emit('ghidraDisconnected');
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