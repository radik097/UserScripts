import asyncio
import httpx

async def debug_sse():
    print("Connecting to SSE...")
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", "http://127.0.0.1:8080/sse", timeout=10.0) as response:
            print(f"Status: {response.status_code}")
            print("Headers:", response.headers)
            async for line in response.aiter_lines():
                print(f"Received: {line}")
                if "data:" in line:
                    break

if __name__ == "__main__":
    asyncio.run(debug_sse())
