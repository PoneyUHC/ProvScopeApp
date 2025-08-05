import websockets
import asyncio
import subprocess
import time
from proxy import GhidraMethods


async def monitor_connection(websocket, ghidra):
    while (True):
        try:
            if (ghidra.has_active_connection()):
                await websocket.send("connected")
            else:
                await websocket.send("disconnected")
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"WebSocket: Error checking connection - {e}")
            await websocket.send("disconnected")


async def ws_server(websocket): 
    print("WebSocket: Client connected. \n")
    ghidra_launched = False

    try:
        async for message in websocket:
            print(f"message received: {message}\n")

            if (message == "use_ghidra") :
                #call ghidraHeadless (create a new project with the bin file & open ghidra on this project)
                subprocess.run(["bash", "src/scripts/ghidra/headlessGhidra.bash"])
                ghidra_launched = True

                print("You need to connect to ghidraBridge...\n")
                ghidra = GhidraMethods()
                bridge, status = ghidra.connect_to_ghidra()

                while (status != "connected"):
                    time.sleep(1)
                    await websocket.send(status)
                    bridge, status = ghidra.connect_to_ghidra()

                await websocket.send(status)
                asyncio.create_task(monitor_connection(websocket, ghidra))
                

            elif (ghidra_launched and message.isdigit()):
                bridge, status = ghidra.connect_to_ghidra()

                while (status != "connected"):
                    time.sleep(1)
                    await websocket.send(status)
                    bridge, status = ghidra.connect_to_ghidra()
                
                await websocket.send(status)
                ghidra.go_to_address(message)

    except websockets.exceptions.ConnectionClosed as e:
        print("WebSocket: Client deconnected.")


async def main():
    async with websockets.serve(ws_server, "localhost", 8765):
        print("Server listening on ws://localhost:8765")    
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())