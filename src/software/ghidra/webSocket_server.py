import websockets
import asyncio



async def ws_server(websocket): 
    print("WebSocket: Server Started. \n")

    try:
        async for message in websocket:
            print(f"message received: {message}")
            await websocket.send(f"You said : {message}")
    except websockets.exceptions.ConnectionClosed as e:
        print("Client deconnected")


async def main():
    async with websockets.serve(ws_server, "localhost", 8765):
        print("Server listening on ws://localhost:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())


