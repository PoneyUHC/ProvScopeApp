import websockets
import asyncio
from proxy import GhidraMethods


async def ws_server(websocket): 
    print("WebSocket: Client connected. \n")

    ghidra = GhidraMethods()
    bridge, status = ghidra.connect_to_ghidra()

    try:
        async for message in websocket:
            print(f"message received: {message}")
            await websocket.send(status)

            if (status == "connected"):
                ghidra.go_to_address(message)
                ghidra.open_new_file("~/Documents/ghidraProjects/test_file")


    except websockets.exceptions.ConnectionClosed as e:
        print("WebSocket: Client deconnected.")


async def main():
    async with websockets.serve(ws_server, "localhost", 8765):
        print("Server listening on ws://localhost:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())


