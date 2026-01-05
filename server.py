import os
import json
import asyncio
import uuid
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import uvicorn

# MCP Imports
from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource

# Configuration
BRIDGE_TOKEN = os.getenv("MCP_BRIDGE_TOKEN", "RODION_DEV_SECRET_2026")

# --- Core Bridge Logic (WebSocket Manager) ---

class BrowserConnection:
    def __init__(self, websocket: WebSocket, url: str, ua: str = "Unknown"):
        self.id = str(uuid.uuid4())[:8]
        self.socket = websocket
        self.url = url
        self.ua = ua
        self.connected_at = asyncio.get_event_loop().time()
        self.pending_requests: Dict[str, asyncio.Future] = {}

class MCPBridge:
    def __init__(self):
        self.connections: Dict[str, BrowserConnection] = {}

    async def connect(self, websocket: WebSocket, token: str, url: str):
        if token != BRIDGE_TOKEN:
            await websocket.close(code=4003)
            return None
        
        await websocket.accept()
        conn = BrowserConnection(websocket, url)
        self.connections[conn.id] = conn
        print(f"[Bridge] ✅ Tab Connected: {conn.id} ({url})")
        
        await websocket.send_json({
            "type": "WELCOME",
            "id": conn.id,
            "message": "Connected to MCP Bridge"
        })
        
        return conn

    async def disconnect(self, conn_id: str):
        if conn_id in self.connections:
            conn = self.connections[conn_id]
            for future in conn.pending_requests.values():
                if not future.done():
                    future.set_exception(ConnectionError("Tab disconnected"))
            del self.connections[conn_id]
            print(f"[Bridge] ❌ Tab Disconnected: {conn_id}")

    async def broadcast_tools(self):
        """Send tools.json to all connected browsers"""
        try:
            tools_path = os.path.join(os.path.dirname(__file__), "tools.json")
            if os.path.exists(tools_path):
                with open(tools_path, "r", encoding="utf-8") as f:
                    tools = json.load(f)
                
                payload = {"type": "TOOLS_MANIFEST", "tools": tools}
                for conn in self.connections.values():
                    try:
                        await conn.socket.send_json(payload)
                    except Exception as e:
                        print(f"[Bridge] ⚠️  Failed to send tools to {conn.id}: {e}")
                return tools
        except Exception as e:
            print(f"[Bridge] ❌ Error syncing tools: {e}")
            return []

    async def execute_tool(self, session_id: str, tool_name: str, params: dict, timeout: float = 30.0):
        """Execute a command in a specific browser tab with async response handling"""
        if not session_id or session_id == "latest":
            if not self.connections:
                raise ValueError("No browser tabs connected")
            target_conn = sorted(self.connections.values(), key=lambda x: x.connected_at)[-1]
        else:
            if session_id not in self.connections:
                raise ValueError(f"Tab ID {session_id} not found")
            target_conn = self.connections[session_id]

        req_id = str(uuid.uuid4())
        
        payload = {
            "method": tool_name,
            "params": params,
            "id": req_id
        }
        
        future = asyncio.Future()
        target_conn.pending_requests[req_id] = future
        
        try:
            await target_conn.socket.send_json(payload)
            print(f"[Bridge] 📤 Sent '{tool_name}' to {target_conn.id}, req_id={req_id}")
            
            result = await asyncio.wait_for(future, timeout=timeout)
            print(f"[Bridge] 📥 Received response for req_id={req_id}")
            return result
            
        except asyncio.TimeoutError:
            print(f"[Bridge] ⏱️  Timeout for '{tool_name}' after {timeout}s")
            raise TimeoutError(f"Tool '{tool_name}' timed out after {timeout}s")
        finally:
            target_conn.pending_requests.pop(req_id, None)

    async def handle_browser_message(self, conn: BrowserConnection, data: dict):
        """Process incoming messages from browser"""
        msg_type = data.get("type")
        
        if msg_type == "LOG":
            print(f"[Browser-{conn.id}] 📋 {data.get('message')}")
            return
        
        req_id = data.get("id")
        if req_id and req_id in conn.pending_requests:
            future = conn.pending_requests[req_id]
            if not future.done():
                result = data.get("result")
                error = data.get("error")
                
                if error:
                    future.set_exception(Exception(f"Browser error: {error}"))
                else:
                    future.set_result(result)

bridge = MCPBridge()

# --- MCP Server Definition ---

mcp = Server("ResilientBrowser-MCP")

# --- MCP Handlers ---

@mcp.list_tools()
async def list_tools() -> list[Tool]:
    """Lists all available tools"""
    tools_list: list[Tool] = []

    tools_list.append(
        Tool(
            name="list_tabs",
            description="Returns a list of all connected browser tabs with their IDs and URLs.",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        )
    )

    tools_list.append(
        Tool(
            name="screenshot",
            description="Takes a screenshot of a browser tab",
            inputSchema={
                "type": "object",
                "properties": {
                    "tab_id": {
                        "type": "string",
                        "description": "Tab ID or 'latest'",
                        "default": "latest"
                    }
                },
                "required": []
            }
        )
    )

    # Dynamic Tools from tools.json
    try:
        tools_path = os.path.join(os.path.dirname(__file__), "tools.json")
        if os.path.exists(tools_path):
            with open(tools_path, "r", encoding="utf-8") as f:
                dynamic_tools = json.load(f)
            
            for dt in dynamic_tools:
                schema = dt.get("parameters", dt.get("input_schema", {"type": "object", "properties": {}}))
                if "properties" not in schema:
                    schema["properties"] = {}
                
                if "tab_id" not in schema["properties"]:
                    schema["properties"]["tab_id"] = {
                        "type": "string", 
                        "description": "Target Browser Tab ID or 'latest'",
                        "default": "latest"
                    }

                tools_list.append(
                    Tool(
                        name=dt["name"],
                        description=dt.get("explain_for_ai", dt.get("description", "")),
                        inputSchema=schema
                    )
                )
    except Exception as e:
        print(f"[MCP] ⚠️  Error loading dynamic tools: {e}")

    return tools_list

@mcp.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent | ImageContent | EmbeddedResource]:
    """Central handler for ALL tool execution"""
    print(f"[MCP] 🔧 Tool called: {name} with args: {arguments}")
    
    tab_id = arguments.pop("tab_id", "latest")
    
    try:
        if name == "list_tabs":
            if not bridge.connections:
                return [TextContent(type="text", text="No tabs connected.")]
            
            tabs_info = [
                f"ID: {cid} | URL: {c.url} | UA: {c.ua}"
                for cid, c in bridge.connections.items()
            ]
            result = "\n".join(tabs_info)
            print(f"[MCP] ✅ list_tabs result: {result}")
            return [TextContent(type="text", text=result)]

        elif name == "screenshot":
            return [TextContent(type="text", text=f"Screenshot functionality requested for tab {tab_id} (not implemented yet).")]

        else:
            result = await bridge.execute_tool(tab_id, name, arguments)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

    except TimeoutError as te:
        print(f"[MCP] ⏱️  {te}")
        return [TextContent(type="text", text=f"Timeout: {str(te)}")]
    except ValueError as ve:
        print(f"[MCP] ⚠️  {ve}")
        return [TextContent(type="text", text=f"Error: {str(ve)}")]
    except Exception as e:
        print(f"[MCP] ❌ Execution failed: {e}")
        return [TextContent(type="text", text=f"Execution Failed: {str(e)}")]


# --- FastAPI App with Lifespan ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("🚀 MCP Server Starting")
    print(f"   Token: {BRIDGE_TOKEN}")
    print(f"   SSE Endpoint: http://127.0.0.1:8080/sse")
    print(f"   Messages Endpoint: http://127.0.0.1:8080/messages")
    print("=" * 60)
    yield
    print("\n🛑 MCP Server Shutting Down")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FastAPI Routes ---

@app.websocket("/mcp-bridge")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None), url: str = Query("unknown")):
    conn = await bridge.connect(websocket, token, url)
    if not conn:
        return

    await bridge.broadcast_tools()

    try:
        while True:
            data = await websocket.receive_json()
            await bridge.handle_browser_message(conn, data)
            
    except WebSocketDisconnect:
        await bridge.disconnect(conn.id)
    except Exception as e:
        print(f"[Bridge] ❌ Error in WebSocket for {conn.id}: {e}")
        await bridge.disconnect(conn.id)

@app.get("/update")
async def update_script():
    file_path = os.path.join(os.path.dirname(__file__), "ResilientMenu.user.js")
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/javascript", filename="ResilientMenu.user.js")
    return {"error": "Script file not found"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "connected_tabs": len(bridge.connections),
        "tabs": [{"id": c.id, "url": c.url} for c in bridge.connections.values()]
    }

# --- Enhanced SSE Transport with Keep-Alive ---

sse_transport = SseServerTransport("/messages")

async def handle_sse(scope, receive, send):
    """Enhanced SSE handler with explicit keep-alive"""
    print(f"[SSE] 🔌 New client connecting from {scope.get('client', 'unknown')}")
    
    try:
        async with sse_transport.connect_sse(scope, receive, send) as streams:
            print("[SSE] ✅ SSE connection established, starting MCP session")
            await mcp.run(streams[0], streams[1], mcp.create_initialization_options())
            print("[SSE] 🏁 MCP session completed normally")
    except Exception as e:
        print(f"[SSE] ❌ Error in SSE handler: {e}")
        raise

class EnhancedSSEMiddleware:
    """Middleware with explicit SSE lifecycle management"""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            method = scope.get("method", "")
            
            normalized_path = path.rstrip("/")
            
            if normalized_path == "/sse":
                print(f"[SSE] 📡 Intercepted SSE request: {method} {path}")
                await handle_sse(scope, receive, send)
                return

            if normalized_path == "/messages" and method == "POST":
                print(f"[SSE] 📨 Intercepted POST to /messages")
                await sse_transport.handle_post_message(scope, receive, send)
                return

        await self.app(scope, receive, send)

app.add_middleware(EnhancedSSEMiddleware)

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8080,
        log_level="info",
        access_log=True
    )