import websockets
import asyncio
import subprocess
import time
from proxy import GhidraMethods


async def ws_server(websocket): 
    print("WebSocket: Client connected. \n")

    try:
        async for message in websocket:
            print(f"message received: {message}\n")

            #call ghidraHeadless (create a new project with the bin file & open ghidra on this project)
            subprocess.run(["bash","src/software/ghidra/headlessGhidra.sh"])

            print("You need to connect to ghidraBridge...\n")
            ghidra = GhidraMethods()
            bridge, status = ghidra.connect_to_ghidra()
            
            while (status != "connected"):
                time.sleep(5)
                await websocket.send(status)
                bridge, status = ghidra.connect_to_ghidra()
            
            await websocket.send(status)
            if (status == "connected"):
                ghidra.go_to_address(message)
           
    except websockets.exceptions.ConnectionClosed as e:
        print("WebSocket: Client deconnected.")


async def main():
    async with websockets.serve(ws_server, "localhost", 8765):
        print("Server listening on ws://localhost:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())


