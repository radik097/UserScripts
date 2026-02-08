#!/usr/bin/env python3
"""
Enhanced MCP Client for Diagnosing SSE Connection Issues
Properly implements SSE session management with session_id
"""

import asyncio
import json
import httpx
import sys
import re
from typing import AsyncIterator, Optional

class MCPDiagnosticClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8080"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)
        self.message_id = 0
        self.session_id: Optional[str] = None
        self.responses = asyncio.Queue()
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, *args):
        await self.client.aclose()
    
    def next_id(self) -> int:
        self.message_id += 1
        return self.message_id
    
    async def send_jsonrpc(self, method: str, params: dict = None) -> dict:
        """Send a JSON-RPC request to /messages with proper session_id"""
        if not self.session_id:
            print("   ⚠️  No session_id yet, waiting for SSE connection...")
            await asyncio.sleep(1)
            if not self.session_id:
                return {"error": "No session established"}
        
        request_id = self.next_id()
        
        payload = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": method,
            "params": params or {}
        }
        
        print(f"\n📤 Sending: {method} (id={request_id})")
        print(f"   Session ID: {self.session_id}")
        print(f"   Payload: {json.dumps(payload, indent=2)}")
        
        # CRITICAL: Include session_id in the endpoint URL as per MCP SSE spec
        response = await self.client.post(
            f"{self.base_url}/messages?session_id={self.session_id}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Response Status: {response.status_code}")
        
        if response.status_code == 202:
            print("   ✅ Message accepted, waiting for SSE response...")
            
            # Wait for response from SSE stream
            try:
                result = await asyncio.wait_for(self.responses.get(), timeout=10.0)
                if result.get("id") == request_id:
                    print(f"   ✅ Got matching response!")
                    return result
                else:
                    print(f"   ⚠️  Response ID mismatch: expected {request_id}, got {result.get('id')}")
                    return result
            except asyncio.TimeoutError:
                print("   ⏱️  Timeout waiting for response")
                return {"error": "timeout"}
        else:
            print(f"   ❌ Unexpected status: {response.text}")
            return {"error": response.text}
    
    async def listen_sse(self) -> AsyncIterator[dict]:
        """Listen to SSE stream and yield messages"""
        print(f"\n🔌 Connecting to SSE stream: {self.base_url}/sse")
        
        async with self.client.stream(
            "GET",
            f"{self.base_url}/sse",
            headers={
                "Accept": "text/event-stream",
                "Cache-Control": "no-cache"
            }
        ) as response:
            print(f"   Connection Status: {response.status_code}")
            print(f"   Response Headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                print(f"   ❌ Failed to connect: {response.status_code}")
                return
            
            print("   ✅ SSE stream connected, listening for events...")
            
            buffer = ""
            async for chunk in response.aiter_text():
                buffer += chunk
                
                # Process complete SSE messages
                while "\n\n" in buffer:
                    message, buffer = buffer.split("\n\n", 1)
                    
                    if not message.strip():
                        continue
                    
                    # Parse SSE event
                    event_type = None
                    event_data = ""
                    event_id = None
                    
                    for line in message.split("\n"):
                        if line.startswith("event:"):
                            event_type = line[6:].strip()
                        elif line.startswith("data:"):
                            event_data += line[5:].strip()
                        elif line.startswith("id:"):
                            event_id = line[3:].strip()
                    
                    # Extract session_id from first message (endpoint event)
                    if event_type == "endpoint" and not self.session_id:
                        # SSE sends endpoint URL with session_id
                        match = re.search(r'session_id=([a-f0-9-]+)', event_data)
                        if match:
                            self.session_id = match.group(1)
                            print(f"\n🔑 Extracted session_id: {self.session_id}")
                    
                    if event_data:
                        try:
                            data = json.loads(event_data)
                            print(f"\n📥 SSE Event Received:")
                            print(f"   Type: {event_type or 'message'}")
                            print(f"   Event ID: {event_id or 'none'}")
                            print(f"   Data: {json.dumps(data, indent=2)}")
                            
                            # Put response in queue for send_jsonrpc
                            await self.responses.put(data)
                            
                            yield data
                        except json.JSONDecodeError as e:
                            print(f"   ⚠️  Failed to parse JSON: {e}")
                            print(f"   Raw data: {event_data}")
    
    async def test_full_cycle(self):
        """Test the complete MCP cycle: connect → initialize → call tool"""
        print("=" * 70)
        print("🧪 DIAGNOSTIC TEST: Full MCP Lifecycle")
        print("=" * 70)
        
        # Step 1: Start SSE listener in background
        sse_task = asyncio.create_task(self._sse_listener())
        
        # Wait for session_id to be extracted
        for i in range(10):
            if self.session_id:
                break
            await asyncio.sleep(0.5)
        
        if not self.session_id:
            print("\n❌ Failed to establish SSE session")
            sse_task.cancel()
            return
        
        # Step 2: Initialize
        print("\n" + "=" * 70)
        print("STEP 1: Initialize MCP Session")
        print("=" * 70)
        result = await self.send_jsonrpc("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "diagnostic-client",
                "version": "1.0.0"
            }
        })
        print(f"Initialize result: {json.dumps(result, indent=2)}")
        
        await asyncio.sleep(1)
        
        # Step 3: List tools
        print("\n" + "=" * 70)
        print("STEP 2: List Available Tools")
        print("=" * 70)
        result = await self.send_jsonrpc("tools/list")
        
        if result and "result" in result:
            tools = result["result"].get("tools", [])
            print(f"\n✅ Found {len(tools)} tools:")
            for tool in tools:
                print(f"   - {tool.get('name')}: {tool.get('description')}")
        
        await asyncio.sleep(1)
        
        # Step 4: Call list_tabs
        print("\n" + "=" * 70)
        print("STEP 3: Call list_tabs Tool")
        print("=" * 70)
        result = await self.send_jsonrpc("tools/call", {
            "name": "list_tabs",
            "arguments": {}
        })
        
        if result and "result" in result:
            content = result["result"].get("content", [])
            print(f"\n✅ Tool result:")
            for item in content:
                if item.get("type") == "text":
                    print(f"{item.get('text')}")
        
        # Wait a bit for any remaining messages
        await asyncio.sleep(2)
        
        # Cancel SSE listener
        sse_task.cancel()
        try:
            await sse_task
        except asyncio.CancelledError:
            print("\n✅ Test completed, SSE listener stopped")
    
    async def _sse_listener(self):
        """Background task to listen to SSE stream"""
        try:
            async for message in self.listen_sse():
                # Messages are already printed and queued in listen_sse
                pass
        except asyncio.CancelledError:
            print("\n🛑 SSE listener cancelled")
        except Exception as e:
            print(f"\n❌ SSE listener error: {e}")
            import traceback
            traceback.print_exc()

async def main():
    print("\n" + "🔬" * 35)
    print(" MCP DIAGNOSTIC CLIENT v2.0")
    print("🔬" * 35 + "\n")
    
    async with MCPDiagnosticClient() as client:
        # First, check if server is alive
        try:
            health = await client.client.get(f"{client.base_url}/health")
            health_data = health.json()
            print(f"✅ Server is alive!")
            print(f"   Connected tabs: {health_data['connected_tabs']}")
            if health_data['tabs']:
                print("   Tabs:")
                for tab in health_data['tabs']:
                    print(f"      - {tab['id']}: {tab['url'][:60]}...")
            print()
        except Exception as e:
            print(f"❌ Server is not responding: {e}\n")
            print("   Make sure to start server with: python server.py\n")
            return
        
        # Run full test
        await client.test_full_cycle()
    
    print("\n" + "=" * 70)
    print("📊 DIAGNOSTIC COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")