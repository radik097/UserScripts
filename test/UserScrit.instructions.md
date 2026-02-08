# Resilient Menu - Project Documentation

This document provides a comprehensive guide to the architecture, modification, and improvement of the Resilient Menu project.

## Project Structure

The project consists of three core files:

1. **`server.py`**: A FastAPI-based Python server that acts as the bridge between the browser and the OS.
2. **`ResilientMenu.user.js`**: A Tampermonkey userscript that injects the menu UI and connects to the server.
3. **`tools.json`**: A JSON manifest defining the dynamic tools available to the client.

---

## 1. `server.py` (The Bridge)

### Architecture

- **Framework**: FastAPI (Asynchronous Python web framework).
- **Communication**: WebSocket (`/mcp-bridge`) for real-time bidirectional communication.
- **Endpoints**:
  - `GET /mcp-bridge`: WebSocket endpoint.
  - `POST /snapshot`: Receives HTML and Screenshots, saves them to `snapshots/`.
  - `POST /log`: Legacy HTTP endpoint for logs (fallback).
  - `GET /update`: Serves the latest `ResilientMenu.user.js` for auto-updates.
  - `POST /execute/{tool_name}`: API to trigger tools from external sources (e.g., AI agents).

### How to Modify & Improve

#### Adding a New Endpoint

To add a new HTTP endpoint (e.g., to upload files), add a route handler:

```python
@app.post("/upload")
async def upload_file(file: UploadFile):
    # Logic to save file
    return {"filename": file.filename}
```

#### Handling New WebSocket Messages

To handle new message types from the client (e.g., `SAVE_CONFIG`), update the `websocket_endpoint` loop:

```python
# Inside the while True loop:
elif msg_type == "SAVE_CONFIG":
    config = data.get("config")
    # Save config to file...
    print(f"Config saved for {url}")
```

#### Improving Security

- **Token**: Change `BRIDGE_TOKEN` in `server.py` and `ResilientMenu.user.js`.
- **Origins**: Update `CORSMiddleware` to restrict `allow_origins` to specific domains if needed.

---

## 2. `ResilientMenu.user.js` (The Client)

### Architecture

- **`MenuCore`**: Manages the UI (creation, styling, drag-and-drop, tabs).
- **`BridgeEngine`**: Handles WebSocket connection, reconnection, and message dispatching.
- **`LogEngine`**: Interцепts `console.log` and sends logs to the server.
- **Styling**: Uses **Scoped CSS** injected into `document.head` to avoid polluting the host page. No Shadow DOM is used for better compatibility.

### How to Modify & Improve

#### Adding a New Tab

1. **Update HTML**: In `renderUI()`, add a new tab button and content container.

    ```javascript
    // Add Tab Button
    tabs.innerHTML += `<div class="rm-tab" data-tab="newtab">New Tab</div>`;
    
    // Add Content
    const newTab = document.createElement('div');
    newTab.className = 'rm-tab-content';
    newTab.id = 'rm-tab-newtab';
    newTab.innerHTML = '...content...';
    tabContentContainer.appendChild(newTab);
    ```

2. **Add Logic**: Add event listeners for elements inside your new tab.

#### Adding a New Client-Side Feature

Implement the feature as a method in `MenuCore` or a new class, then expose it or trigger it from the UI.

#### Improving Robustness

- **Reconnect Logic**: `BridgeEngine` currently reconnects every 3s. You can implement exponential backoff.
- **Error Handling**: Wrap critical logic in `try-catch` blocks and use `this.showToast()` to notify the user.

---

## 3. `tools.json` (The Tool Manifest)

### Schema

Each tool is a JSON object with the following fields:

- **`route`**: Unique identifier path (e.g., `/ui/alert`).
- **`name`**: The function name used for execution (e.g., `showAlert`).
- **`description`**: Human-readable explanation of what the tool does.
- **`code`**: The JavaScript code to execute. The variable `params` contains the arguments.
- **`version`**: Semantic version string (e.g., `1.0.0`).
- **`args`**: Dictionary describing expected parameters (for AI/Documentation).
- **`explain_for_ai`**: Context for AI agents.

### How to Add a New Tool

1. Open `tools.json`.
2. Add a new object to the array.

    ```json
    {
        "route": "/nav/reload",
        "name": "reloadPage",
        "description": "Reloads the current page.",
        "code": "location.reload();",
        "version": "1.0.0",
        "args": {},
        "explain_for_ai": "Use this to refresh the page state."
    }
    ```

3. **Sync**: Click "Update Tools" in the menu or restart the server.

### Advanced Tooling

You can write complex tools that:

- Fetch data (`fetch()`).
- Manipulate the DOM.
- Interact with global variables on the page (via `unsafeWindow` if needed, though `new Function` runs in the script's context).

---

## 4. Automation Engine (Advanced)

The project implements a 4-level automation architecture to handle complex interactions without overcomplicating `tools.json`.

### Level 1: Simple Wrappers (Pure JSON)
Direct mappings to standard browser APIs. Defined entirely in `tools.json`.
*   **Examples**: `reloadPage`, `goBack`, `scrollTo`, `getCookies`.

### Level 2: Helper Library (Client-Side Logic)
Complex logic (finding elements, event simulation) is implemented in `ResilientMenu.user.js` as the `AutomationUtils` class and exposed via `window.menu.automation`.
*   **Examples**: `smartClick`, `typeText`, `waitForElement`.

### Level 3: Async Scenarios (Complex JSON)
Scripts that combine multiple helpers and async logic. Since `BridgeEngine` supports async execution, you can write multi-step workflows in `tools.json`.
*   **Example**: Wait for element -> Click -> Wait -> Type.

### Level 4: System/Multi-Tab (Server-Side)
Actions that require coordination outside the current tab (e.g., opening new tabs, cross-tab messaging).

### Key Automation Helpers (`window.menu.automation`)

*   **`waitForElement(selector, timeout)`**: Uses `MutationObserver` to wait for an element.
*   **`smartClick(selector)`**: Dispatches `mouseover`, `mousedown`, `mouseup`, `click` events.
*   **`typeText(selector, text)`**: Simulates typing with `keydown`, `keypress`, `input`, `keyup` events.
*   **`smartFind(selector)`**:
    *   CSS: `div.content`
    *   XPath: `xpath://div[@id='main']`
    *   Text: `text:Submit`

---

## 5. MCP Integration (Model Context Protocol)

The server implements the **MCP SSE Transport**, allowing AI agents to discover and call tools directly.

### Architecture

- **Endpoints**:
  - `GET /sse`: The Server-Sent Events stream. The client connects here to receive messages from the server.
  - `POST /messages`: The endpoint where the client sends JSON-RPC requests to the server.
- **Middleware**: `SSEMiddleware` is used to intercept these paths and handle them at the ASGI level, bypassing FastAPI's routing to prevent response lifecycle conflicts.

### Known Issues & Troubleshooting

#### 1. `EOF` / `client is closing` Error
**Problem**: The AI Agent logs show `Failure in MCP tool execution: connection closed: calling "tools/call": client is closing: EOF`.
**Cause**: The MCP client (the agent environment) is closing the SSE connection prematurely, often immediately after sending a `POST /messages` request, without waiting for the response in the SSE stream.
**Solution**: Ensure the client maintains a persistent SSE connection. On the server side, `SSEMiddleware` ensures the connection is handled correctly according to the ASGI spec.

#### 2. Verification with `test_mcp_client.py`
To verify that the server is working correctly independent of the agent environment:
1. Start the server: `python server.py`.
2. Run the test client: `python test_mcp_client.py`.
3. The test client will connect to `/sse`, initialize the session, and call `list_tabs`. If it receives a result, the server is functioning correctly.

### Best Practices for MCP
- **Persistent SSE**: The SSE stream must remain open for the entire duration of the session.
- **JSON-RPC**: All communication follows the JSON-RPC 2.0 specification.
- **Dynamic Tools**: Tools defined in `tools.json` are automatically exposed via the `list_tools` handler.
