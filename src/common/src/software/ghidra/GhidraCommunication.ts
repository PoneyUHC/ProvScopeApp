import WebSocket from 'ws';


export class GhidraCommunication {
    private url: string;
    private socket: WebSocket | null = null;

    constructor(url: string){
        this.url = url;
    }

    webSocketConnection(): void {
        this.socket = new WebSocket(this.url);

        this.socket.on('open', () => { console.log("Connected to the WebSocket \n") });

        this.socket.on('message', (data: WebSocket.RawData)  => {
            const message = data.toString();
            console.log("Message received from the WebSocket server : ",message);
            this.isGhidraConnected(message);
        });
    }

    sendMessage(message: string){
        if(this.socket && this.socket.readyState === WebSocket.OPEN){
            this.socket.send(message);
        }
    }

    closeWebSocket(){ 
        if (this.socket) {
            this.socket.close();
        }
    }  

    isGhidraConnected(data: WebSocket.RawData){
        if(data.toString() === "connected"){
            //show green signal light
        }
        else{
            //show red signal light
        }
    }
}