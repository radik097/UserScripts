import asyncio
from mcp.client.sse import sse_client
from mcp.client.session import ClientSession

async def run():
    try:
        async with sse_client("http://127.0.0.1:8080/sse") as streams:
            async with ClientSession(streams[0], streams[1]) as session:
                await session.initialize()
                
                result = await session.call_tool("list_tabs", {})
                print(result.content[0].text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
