// ==UserScript==
// @name         Resilient Menu
// @namespace    http://tampermonkey.net/
// @version      0.9.10
// @description  A resilient, isolated menu for userscripts.
// @author       Antigravity
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @downloadURL  http://127.0.0.1:8080/update
// @require      https://cdn.jsdelivr.net/npm/toastify-js
// @require      https://html2canvas.hertzen.com/dist/html2canvas.min.js
// @resource     TOASTIFY_CSS https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// ==/UserScript==

(function () {
    'use strict';

    const DEV = true;
    function debugLog(...args) {
        if (DEV) console.log('[ResilientMenu Debug]', ...args);
    }

    // UA Spoofer (Must run early)
    const FAKE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    try {
        Object.defineProperty(navigator, 'userAgent', {
            get: function () { return FAKE_UA; }
        });
        debugLog('UserAgent spoofed:', FAKE_UA);
    } catch (e) {
        console.warn('[ResilientMenu] Failed to spoof UA:', e);
    }

    class MenuCore {
        constructor() {
            this.container = null;
            this.dragState = {
                active: false,
                xOffset: GM_getValue('menu_pos_x', 20),
                yOffset: GM_getValue('menu_pos_y', 20)
            };
            this.activeTab = 'connection'; // connection, tools, logs
        }

        async init() {
            try {
                await this.waitForBody();
                this.injectAllStyles();
                this.renderUI();
                this.updatePosition();
                this.initDrag();
                this.initRescue();
                this.showToast('Resilient Menu Ready', 'success');
            } catch (e) {
                console.error('[ResilientMenu] Init Error:', e);
            }
        }

        waitForBody() {
            return new Promise(resolve => {
                if (document.body) return resolve();
                const observer = new MutationObserver(() => {
                    if (document.body) {
                        observer.disconnect();
                        resolve();
                    }
                });
                observer.observe(document.documentElement, { childList: true });
            });
        }

        injectAllStyles() {
            const toastify = GM_getResourceText("TOASTIFY_CSS");

            const style = document.createElement('style');
            style.textContent = `
                ${toastify}
                
                /* Scoped Menu Styles */
                #resilient-menu-container {
                    position: fixed;
                    z-index: 2147483647;
                    background: #222;
                    color: #eee;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                                border-radius 0.3s ease;
                    overflow: hidden;
                    border: 1px solid #444;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.5;
                    font-size: 14px;
                    box-sizing: border-box;
                }

                #resilient-menu-container * {
                    box-sizing: border-box;
                }

                #resilient-menu-container.expanded {
                    width: 350px;
                    height: auto;
                    max-height: 90vh;
                    border-radius: 12px;
                    overflow-y: auto;
                }

                #rm-menu-header {
                    background: #333;
                    padding: 10px 15px;
                    cursor: move;
                    display: none;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #444;
                    font-weight: 600;
                    color: #fff;
                }

                #resilient-menu-container.expanded #rm-menu-header { display: flex; }

                #rm-toggle-btn {
                    width: 50px;
                    height: 50px;
                    min-width: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-weight: bold;
                    color: #00d1b2;
                    user-select: none;
                }

                #resilient-menu-container.expanded #rm-toggle-btn { display: none; }

                .rm-content { padding: 0; display: none; flex-direction: column; height: 100%; }
                #resilient-menu-container.expanded .rm-content { display: flex; }

                /* Tabs */
                .rm-tabs {
                    display: flex;
                    background: #2a2a2a;
                    border-bottom: 1px solid #444;
                }
                
                .rm-tab {
                    flex: 1;
                    padding: 10px;
                    text-align: center;
                    cursor: pointer;
                    color: #aaa;
                    font-size: 13px;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                
                .rm-tab:hover { color: #fff; background: rgba(255,255,255,0.05); }
                .rm-tab.active { color: #00d1b2; border-bottom-color: #00d1b2; font-weight: 600; }

                .rm-tab-content {
                    padding: 15px;
                    overflow-y: auto;
                    flex: 1;
                    display: none;
                }
                
                .rm-tab-content.active { display: block; }

                /* Custom Components */
                .rm-label {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 12px;
                    color: #aaa;
                }

                .rm-input {
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 10px;
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 4px;
                    color: #fff;
                    font-size: 13px;
                }
                
                .rm-input:focus {
                    border-color: #00d1b2;
                    outline: none;
                }

                .rm-btn {
                    display: block;
                    width: 100%;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    text-align: center;
                    transition: background 0.2s;
                    margin-bottom: 8px;
                }

                .rm-btn.success { background: #28a745; color: white; }
                .rm-btn.success:hover { background: #218838; }

                .rm-btn.warning { background: #ffc107; color: #222; }
                .rm-btn.warning:hover { background: #e0a800; }
                
                .rm-btn.info { background: #17a2b8; color: white; }
                .rm-btn.info:hover { background: #138496; }
                
                .rm-btn.secondary { background: #6c757d; color: white; }
                .rm-btn.secondary:hover { background: #5a6268; }

                .rm-hr {
                    border: 0;
                    border-top: 1px solid #444;
                    margin: 15px 0;
                }

                .rm-log-item {
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding: 2px 0;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                
                .rm-tool-card {
                    background: #333;
                    border: 1px solid #444;
                    border-radius: 4px;
                    padding: 10px;
                    margin-bottom: 10px;
                }
                
                .rm-tool-name { font-weight: bold; color: #fff; margin-bottom: 4px; }
                .rm-tool-desc { font-size: 12px; color: #aaa; margin-bottom: 8px; }
            `;
            document.head.appendChild(style);
        }

        renderUI() {
            this.container = document.createElement('div');
            this.container.id = 'resilient-menu-container';

            // Toggle Button
            const toggleBtn = document.createElement('div');
            toggleBtn.id = 'rm-toggle-btn';
            toggleBtn.textContent = 'RM';
            toggleBtn.addEventListener('click', () => this.toggleMenu());

            // Header
            const header = document.createElement('div');
            header.id = 'rm-menu-header';
            header.innerHTML = '<span>Resilient Menu</span><span style="cursor:pointer" id="rm-close-btn">×</span>';

            // Content Wrapper
            const content = document.createElement('div');
            content.className = 'rm-content';

            // Tabs
            const tabs = document.createElement('div');
            tabs.className = 'rm-tabs';
            tabs.innerHTML = `
                <div class="rm-tab active" data-tab="connection">Connection</div>
                <div class="rm-tab" data-tab="tools">Tools</div>
                <div class="rm-tab" data-tab="logs">Logs</div>
            `;
            content.appendChild(tabs);

            // Tab Contents
            const tabContentContainer = document.createElement('div');
            tabContentContainer.style.flex = '1';
            tabContentContainer.style.overflow = 'hidden';
            tabContentContainer.style.display = 'flex';
            tabContentContainer.style.flexDirection = 'column';

            // 1. Connection Tab
            const connTab = document.createElement('div');
            connTab.className = 'rm-tab-content active';
            connTab.id = 'rm-tab-connection';
            connTab.innerHTML = `
                <label class="rm-label">WebSocket URL</label>
                <input type="text" class="rm-input" id="rm-ws-url" value="${GM_getValue('ws_url', 'ws://127.0.0.1:8080/mcp-bridge')}">
                
                <label class="rm-label">Token</label>
                <input type="password" class="rm-input" id="rm-ws-token" value="${GM_getValue('ws_token', 'RODION_DEV_SECRET_2026')}">
                
                <button id="rm-save-connect-btn" class="rm-btn success">Save & Connect</button>
                <div id="rm-connection-status" style="margin-top:8px; font-size:12px; color:#aaa;">Status: Disconnected</div>
                
                <hr class="rm-hr">
                <button id="rm-snapshot-btn" class="rm-btn warning">Take Snapshot</button>
            `;
            tabContentContainer.appendChild(connTab);

            // 2. Tools Tab
            const toolsTab = document.createElement('div');
            toolsTab.className = 'rm-tab-content';
            toolsTab.id = 'rm-tab-tools';
            toolsTab.innerHTML = `
                <button id="rm-update-tools-btn" class="rm-btn info">Update Tools (Sync)</button>
                <hr class="rm-hr">
                <div id="rm-tools-list">
                    <div style="text-align:center; color:#777; padding: 20px;">No tools synced yet.</div>
                </div>
            `;
            tabContentContainer.appendChild(toolsTab);

            // 3. Logs Tab
            const logsTab = document.createElement('div');
            logsTab.className = 'rm-tab-content';
            logsTab.id = 'rm-tab-logs';
            logsTab.innerHTML = `
                <div id="rm-log-list" style="height: 100%; overflow-y: auto; background: rgba(0,0,0,0.3); font-family: monospace; font-size: 11px; padding: 8px;"></div>
            `;
            tabContentContainer.appendChild(logsTab);

            content.appendChild(tabContentContainer);

            this.container.appendChild(toggleBtn);
            this.container.appendChild(header);
            this.container.appendChild(content);
            document.body.appendChild(this.container);

            // --- Event Listeners ---

            // Tab Switching
            tabs.querySelectorAll('.rm-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.querySelectorAll('.rm-tab').forEach(t => t.classList.remove('active'));
                    tabContentContainer.querySelectorAll('.rm-tab-content').forEach(c => c.classList.remove('active'));

                    tab.classList.add('active');
                    const targetId = `rm-tab-${tab.dataset.tab}`;
                    document.getElementById(targetId).classList.add('active');
                });
            });

            // Close Button
            const closeBtn = header.querySelector('#rm-close-btn');
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });

            // Connection Logic
            const saveBtn = connTab.querySelector('#rm-save-connect-btn');
            const wsUrlInput = connTab.querySelector('#rm-ws-url');
            const wsTokenInput = connTab.querySelector('#rm-ws-token');
            const statusDiv = connTab.querySelector('#rm-connection-status');

            saveBtn.addEventListener('click', () => {
                const url = wsUrlInput.value.trim();
                const token = wsTokenInput.value.trim();
                GM_setValue('ws_url', url);
                GM_setValue('ws_token', token);

                if (window.menu && window.menu.bridge) {
                    window.menu.bridge.wsUrl = url;
                    window.menu.bridge.token = token;
                    window.menu.bridge.ws.close();
                    statusDiv.textContent = 'Status: Reconnecting...';
                }
            });

            // Snapshot Logic
            const snapshotBtn = connTab.querySelector('#rm-snapshot-btn');
            snapshotBtn.addEventListener('click', () => this.takeSnapshot());

            // Update Tools Logic
            const updateToolsBtn = toolsTab.querySelector('#rm-update-tools-btn');
            updateToolsBtn.addEventListener('click', () => {
                if (window.menu && window.menu.bridge) {
                    window.menu.bridge.requestTools();
                } else {
                    this.showToast('Bridge not ready', 'error');
                }
            });

            // Status Update Loop
            setInterval(() => {
                if (window.menu && window.menu.bridge && window.menu.bridge.ws) {
                    const state = window.menu.bridge.ws.readyState;
                    const states = ['Connecting', 'Open', 'Closing', 'Closed'];
                    statusDiv.textContent = `Status: ${states[state]}`;
                    statusDiv.style.color = state === 1 ? '#2ecc71' : '#e74c3c';
                }
            }, 1000);

            // Log Listener
            const logList = logsTab.querySelector('#rm-log-list');
            if (window.menu && window.menu.logger) {
                window.menu.logger.addListener((log) => {
                    const item = document.createElement('div');
                    item.className = 'rm-log-item';
                    item.style.color = log.type === 'error' ? '#e74c3c' : log.type === 'warn' ? '#f1c40f' : '#bdc3c7';
                    item.textContent = `[${log.timestamp.split('T')[1].split('.')[0]}] ${log.message}`;
                    logList.appendChild(item);
                    logList.scrollTop = logList.scrollHeight;
                });
            }
        }

        renderToolsList(tools) {
            const list = document.getElementById('rm-tools-list');
            if (!list) return;

            list.innerHTML = '';

            if (Object.keys(tools).length === 0) {
                list.innerHTML = '<div style="text-align:center; color:#777; padding: 20px;">No tools synced yet.</div>';
                return;
            }

            for (const [name, tool] of Object.entries(tools)) {
                const card = document.createElement('div');
                card.className = 'rm-tool-card';

                const title = document.createElement('div');
                title.className = 'rm-tool-name';
                title.textContent = tool.def.name || name;

                const desc = document.createElement('div');
                desc.className = 'rm-tool-desc';
                desc.textContent = tool.def.description || 'No description';

                const btn = document.createElement('button');
                btn.className = 'rm-btn secondary';
                btn.textContent = 'Run Tool';
                btn.onclick = async () => {
                    try {
                        this.showToast(`Running ${name}...`, 'info');
                        // Simple execution with empty params for now, 
                        // or prompt for params if we want to be fancy later.
                        await tool.fn({});
                        this.showToast(`${name} executed`, 'success');
                    } catch (e) {
                        this.showToast(`Error: ${e.message}`, 'error');
                    }
                };

                card.appendChild(title);
                card.appendChild(desc);
                card.appendChild(btn);
                list.appendChild(card);
            }
        }

        toggleMenu() {
            this.container.classList.toggle('expanded');
        }

        initDrag() {
            const container = this.container;
            let startX, startY;

            const onMouseDown = (e) => {
                const target = e.target;
                if (target.id !== 'rm-toggle-btn' && target.id !== 'rm-menu-header' && target.parentNode.id !== 'rm-menu-header') return;

                this.dragState.active = true;
                startX = e.clientX - this.dragState.xOffset;
                startY = e.clientY - this.dragState.yOffset;

                container.style.transition = 'none';
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };

            const onMouseMove = (e) => {
                if (!this.dragState.active) return;

                this.dragState.xOffset = e.clientX - startX;
                this.dragState.yOffset = e.clientY - startY;

                this.updatePosition();
            };

            const onMouseUp = () => {
                this.dragState.active = false;
                container.style.transition = '';
                GM_setValue('menu_pos_x', this.dragState.xOffset);
                GM_setValue('menu_pos_y', this.dragState.yOffset);
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousedown', onMouseDown);
        }

        updatePosition() {
            const x = Math.max(0, Math.min(this.dragState.xOffset, window.innerWidth - 50));
            const y = Math.max(0, Math.min(this.dragState.yOffset, window.innerHeight - 50));
            this.container.style.left = `${x}px`;
            this.container.style.top = `${y}px`;
        }

        initRescue() {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
                    this.dragState.xOffset = 20;
                    this.dragState.yOffset = 20;
                    this.updatePosition();
                    if (!document.body.contains(this.container)) {
                        document.body.appendChild(this.container);
                    }
                    this.container.classList.remove('expanded');
                    this.showToast('Menu Rescued!');
                }
            });
        }

        showToast(text, type = 'info') {
            Toastify({
                text: text,
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                style: {
                    background: type === 'error' ? "#ff6b6b" : type === 'success' ? "#28a745" : "#333",
                }
            }).showToast();
        }

        async takeSnapshot() {
            this.showToast('Taking snapshot...', 'info');

            // Hide menu
            this.container.style.display = 'none';
            await new Promise(r => setTimeout(r, 200)); // Wait for render

            try {
                // Capture Screenshot
                const canvas = await html2canvas(document.body, {
                    useCORS: true,
                    logging: false
                });
                const screenshot = canvas.toDataURL('image/png');

                // Capture DOM
                const html = document.documentElement.outerHTML;

                // Restore menu
                this.container.style.display = 'flex';

                // Send to server
                GM_xmlhttpRequest({
                    method: "POST",
                    url: "http://127.0.0.1:8080/snapshot",
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify({
                        html: html,
                        screenshot: screenshot
                    }),
                    onload: (res) => {
                        if (res.status === 200) {
                            this.showToast('Snapshot Saved!', 'success');
                        } else {
                            this.showToast('Snapshot Failed', 'error');
                        }
                    },
                    onerror: () => {
                        this.container.style.display = 'flex';
                        this.showToast('Snapshot Error', 'error');
                    }
                });

            } catch (e) {
                console.error('Snapshot failed:', e);
                this.container.style.display = 'flex';
                this.showToast('Snapshot Failed: ' + e.message, 'error');
            }
        }
    }

    class BridgeEngine {
        constructor() {
            this.ws = null;
            // Hardcoded defaults for reliability as requested
            this.defaultUrl = 'ws://127.0.0.1:8080/mcp-bridge';
            this.defaultToken = 'RODION_DEV_SECRET_2026';

            this.token = GM_getValue('ws_token', this.defaultToken);
            this.wsUrl = GM_getValue('ws_url', this.defaultUrl);
            this.reconnectInterval = 3000;
            this.tools = {}; // Dynamic Tool Registry { name: { fn, def } }
        }

        init() {
            this.connect();
        }

        connect() {
            const encodedUrl = encodeURIComponent(location.href);
            const fullUrl = `${this.wsUrl}?token=${this.token}&url=${encodedUrl}`;

            debugLog(`[BridgeEngine] Connecting to ${this.wsUrl}...`);
            this.ws = new WebSocket(fullUrl);

            this.ws.onopen = () => {
                console.log('[BridgeEngine] Connected to MCP Bridge');
                if (window.menu) window.menu.showToast('MCP Bridge Connected', 'success');

                // Send initial status
                this.ws.send(JSON.stringify({
                    type: 'STATUS',
                    message: 'Connected',
                    url: location.href
                }));
            };

            this.ws.onmessage = async (event) => {
                const request = JSON.parse(event.data);
                debugLog('[BridgeEngine] Request:', request);

                // Handle Tool Manifest Sync
                if (request.type === 'TOOLS_MANIFEST') {
                    this.registerTools(request.tools);
                    return;
                }

                // Handle Welcome Message (Tab ID)
                if (request.type === 'WELCOME') {
                    debugLog(`[BridgeEngine] Connected with ID: ${request.id}`);
                    if (window.menu) {
                        window.menu.updateStatus(`Connected (ID: ${request.id})`, 'success');
                        window.menu.showToast(`Tab ID: ${request.id}`, 'success');
                    }
                    return;
                }

                let result = { error: "Tool not found" };

                // Execute Dynamic Tool
                if (this.tools[request.method]) {
                    try {
                        const toolFn = this.tools[request.method].fn;
                        result = await toolFn(request.params || {});
                    } catch (e) {
                        result = { error: e.message, stack: e.stack };
                    }
                }
                // Fallback: Basic DOM Tool (Built-in)
                else if (request.method === 'get_dom') {
                    const el = document.querySelector(request.params.selector || 'body');
                    result = { html: el?.innerHTML, text: el?.innerText };
                }

                this.ws.send(JSON.stringify({
                    id: request.id,
                    result: result
                }));
            };

            this.ws.onclose = () => {
                console.warn('[BridgeEngine] Disconnected. Reconnecting...');
                setTimeout(() => this.connect(), this.reconnectInterval);
            };

            this.ws.onerror = (err) => {
                console.error('[BridgeEngine] Error:', err);
            };
        }

        requestTools() {
            if (this.ws && this.ws.readyState === 1) {
                this.ws.send(JSON.stringify({ type: 'GET_TOOLS' }));
                if (window.menu) window.menu.showToast('Requesting tools...', 'info');
            } else {
                if (window.menu) window.menu.showToast('Not connected', 'error');
            }
        }

        registerTools(toolDefinitions) {
            let count = 0;
            this.tools = {}; // Reset registry

            toolDefinitions.forEach(def => {
                try {
                    // Create function from code string
                    // params is the argument name
                    const fn = new Function('params', def.code);
                    this.tools[def.name] = { fn: fn, def: def };
                    count++;
                    debugLog(`[BridgeEngine] Registered tool: ${def.name} (v${def.version || '?'})`);
                } catch (e) {
                    console.error(`[BridgeEngine] Failed to register tool ${def.name}:`, e);
                }
            });

            console.log(`[BridgeEngine] Registered ${count} dynamic tools.`);
            if (window.menu) {
                window.menu.showToast(`Synced ${count} Tools`, 'info');
                window.menu.renderToolsList(this.tools);
            }
        }
    }

    class LogEngine {
        constructor() {
            this.logs = [];
            this.maxLogs = 1000;
            this.originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info
            };
            this.listeners = [];
        }

        init() {
            this.intercept();
        }

        intercept() {
            const proxy = (type) => {
                return (...args) => {
                    this.originalConsole[type].apply(console, args);
                    this.addLog(type, args);
                };
            };

            const target = typeof unsafeWindow !== 'undefined' ? unsafeWindow.console : console;
            target.log = proxy('log');
            target.warn = proxy('warn');
            target.error = proxy('error');
            target.info = proxy('info');
        }

        addLog(type, args) {
            const message = args.map(arg => {
                try {
                    return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                } catch (e) {
                    return '[Circular/Error]';
                }
            }).join(' ');

            const logEntry = {
                timestamp: new Date().toISOString(),
                type: type,
                message: message,
                level: type, // Added level for server
                url: location.href // Added URL for server
            };

            this.logs.push(logEntry);
            if (this.logs.length > this.maxLogs) this.logs.shift();

            this.notifyListeners(logEntry);

            if (DEV && window.menu && window.menu.bridge && window.menu.bridge.ws && window.menu.bridge.ws.readyState === 1) {
                // Send via WebSocket if connected
                window.menu.bridge.ws.send(JSON.stringify({
                    type: 'LOG',
                    level: type,
                    message: message,
                    url: location.href
                }));
            } else if (DEV) {
                // Fallback to HTTP
                this.sendRemoteLog(logEntry);
            }
        }

        sendRemoteLog(logEntry) {
            GM_xmlhttpRequest({
                method: "POST",
                url: "http://127.0.0.1:8080/log",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    type: logEntry.type.toUpperCase(),
                    message: logEntry.message,
                    level: logEntry.type,
                    url: location.href
                }),
                onload: () => { },
                onerror: () => { }
            });
        }

        addListener(callback) {
            this.listeners.push(callback);
        }

        notifyListeners(logEntry) {
            this.listeners.forEach(cb => cb(logEntry));
        }
    }

    class AutomationUtils {
        constructor() {
            this.debug = true;
        }

        log(msg) {
            if (this.debug) console.log(`[AutomationUtils] ${msg}`);
        }

        // --- Level 2 Helpers ---

        async waitForElement(selector, timeout = 5000) {
            this.log(`Waiting for: ${selector}`);
            return new Promise((resolve, reject) => {
                const el = this.smartFind(selector);
                if (el) return resolve(el);

                const observer = new MutationObserver(() => {
                    const el = this.smartFind(selector);
                    if (el) {
                        observer.disconnect();
                        resolve(el);
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true
                });

                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for element: ${selector}`));
                }, timeout);
            });
        }

        smartFind(selector) {
            if (!selector) return null;
            // XPath
            if (selector.startsWith('//') || selector.startsWith('xpath:')) {
                const xpath = selector.replace(/^xpath:/, '');
                const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                return result.singleNodeValue;
            }
            // Text Search (custom prefix text:)
            if (selector.startsWith('text:')) {
                const text = selector.replace(/^text:/, '');
                const elements = document.querySelectorAll('*'); // Inefficient but simple for now
                for (let el of elements) {
                    if (el.textContent.includes(text) && el.children.length === 0) { // Leaf nodes preferred
                        return el;
                    }
                }
                return null;
            }
            // CSS Selector
            return document.querySelector(selector);
        }

        simulateClick(selector) {
            const el = typeof selector === 'string' ? this.smartFind(selector) : selector;
            if (!el) throw new Error(`Element not found for click: ${selector}`);

            this.log(`Clicking: ${selector}`);

            // Create a sequence of events to mimic real user interaction
            const events = ['mouseover', 'mousedown', 'mouseup', 'click'];
            events.forEach(eventType => {
                const event = new MouseEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    buttons: 1
                });
                el.dispatchEvent(event);
            });
            return true;
        }

        async simulateType(selector, text, delay = 50) {
            const el = typeof selector === 'string' ? this.smartFind(selector) : selector;
            if (!el) throw new Error(`Element not found for typing: ${selector}`);

            this.log(`Typing "${text}" into ${selector}`);

            el.focus();

            // Clear existing if needed (optional, maybe make it a param)
            // el.value = ''; 

            for (const char of text) {
                const keyEvent = new KeyboardEvent('keydown', { key: char, bubbles: true });
                el.dispatchEvent(keyEvent);

                const pressEvent = new KeyboardEvent('keypress', { key: char, bubbles: true });
                el.dispatchEvent(pressEvent);

                // Input event is crucial for React/Vue
                el.value = (el.value || '') + char;
                const inputEvent = new Event('input', { bubbles: true });
                el.dispatchEvent(inputEvent);

                const upEvent = new KeyboardEvent('keyup', { key: char, bubbles: true });
                el.dispatchEvent(upEvent);

                if (delay > 0) await new Promise(r => setTimeout(r, delay));
            }

            const changeEvent = new Event('change', { bubbles: true });
            el.dispatchEvent(changeEvent);

            return true;
        }
    }

    // Initialize
    const menu = new MenuCore();
    const logger = new LogEngine();
    const bridge = new BridgeEngine();
    const automation = new AutomationUtils();

    // Expose modules
    window.menu = menu;
    menu.logger = logger;
    menu.bridge = bridge;
    menu.automation = automation; // Expose for tools.json

    // Initialize Logger
    logger.init();

    // Start
    menu.init();
    bridge.init();

})();
