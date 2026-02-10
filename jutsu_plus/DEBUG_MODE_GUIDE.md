# Jut.su Auto+ Debug Mode Guide (v3.6)

## 🔧 Debug Mode Overview

Debug Mode is a comprehensive diagnostics and troubleshooting feature that logs detailed information about script execution, API requests, source injection, and all internal operations.

---

## ✨ How to Enable Debug Mode

### Method 1: Settings Panel (Easiest)
1. Click the **⚙️** button in the top-right corner
2. Toggle **🔧 Debug Mode** switch
3. All subsequent operations will be logged in real-time

### Method 2: Tampermonkey Menu
1. Click the **Tampermonkey icon** (or extension menu)
2. Select `🔧 Debug Mode: ⚫ OFF` → toggles to `🔧 Debug Mode: 🟢 ON`

### Method 3: Console Command
```javascript
// In DevTools Console (press F12)
window.debugMode = true;
GM_setValue('debugMode', true);
```

---

## 📊 What Debug Mode Logs

### Real-Time Console Output
When enabled, **every operation** is logged to the browser console immediately with color-coded prefixes:

| Category | Color | Logged For |
|----------|-------|-----------|
| `[INIT]` | 🟢 Green | Module initialization and setup |
| `[VIDEO]` | 🟢 Green | Player detection and source injection |
| `[API]` | 🟢 Green | External API requests and responses |
| `[UI]` | 🟡 Yellow | UI interactions and panel updates |
| `[ERROR]` | 🔴 Red | Errors and failures |
| `[DEBUG]` | 🟠 Orange | Detailed debugging information |

### API Response Logging
Full server responses are logged, including:
- HTTP status codes
- Response headers
- Raw JSON content (first 1000 characters)
- Request timing (milliseconds)
- Parsed results count and details

### Source Injection Details
- Video element detection
- Source type detection (direct vs iframe)
- All injected `<source>` elements
- Iframe creation and attributes
- Injection success/failure reasons

### Module Initialization Tracking
- Initialization order and timing
- Observer attachment/disconnection
- Settings synchronization
- Performance metrics

---

## 🎯 Using Debug Mode for Troubleshooting

### Problem: External sources not loading
**Debug Steps:**
1. Enable Debug Mode
2. Reload the episode page
3. Check console for `[API]` and `[VIDEO]` logs
4. Look for error messages with `[RAW RESPONSE]` section
5. Verify API response contains `results` array

**Example Console Output:**
```
[15:16:38] [API] Fetching sources for: Смотреть Гены искусственного интеллекта
[15:16:38] [DEBUG] Starting API request {url, title, timeout, ...}
[15:16:39] [API] HTTP response 200
[RAW RESPONSE]
{"results":[...]}
```

### Problem: Video not playing after injection
**Debug Steps:**
1. Enable Debug Mode
2. Reload page
3. Look for `[VIDEO]` logs showing injection process
4. Check `[DEBUG]` logs for source element creation
5. Verify container positioning and z-index

### Problem: Menu commands not working
**Debug Steps:**
1. Enable Debug Mode
2. Click menu command
3. Check for `[UI]` logs confirming action
4. Look for `[INIT]` logs showing setting update
5. Run this in console:
```javascript
console.table({
    autoSkip: settings.autoSkip,
    autoNext: settings.autoNext,
    externalInject: settings.externalInject,
    debugMode: window.debugMode
});
```

---

## 🔍 Console Output Examples

### Successful Source Injection (Debug Mode)
```
[15:16:38] [INIT] Starting main initialization sequence
[15:16:38] [DEBUG] Script initialization started {url, userAgent, debugMode, timestamp}
[15:16:38] [INIT] Styles injected
[15:16:38] [INIT] Menu registered
[15:16:38] [INIT] All 5 feature modules initialized
[15:16:39] [VIDEO] Fetching sources for: Гены искусственного интеллекта 1 серия
[15:16:39] [DEBUG] Starting API request {url: "...", title: "...", timeout: 5000}
[15:16:40] [DEBUG] API response received {status: 200, duration: "1023ms", responseLength: 2456}
[RAW RESPONSE]
{"results":[{"id":"anime-1","title":"Гены","link":"https://...","quality":"720p"}]}
[15:16:40] [DEBUG] JSON parse successful {resultKeys: ["results"], resultCount: 1}
[15:16:40] [API] Found 1 result(s)
[15:16:40] [DEBUG] Source selected {savedId: null, usesSaved: false, selectedSourceId: "anime-1", totalResults: 1}
[15:16:40] [DEBUG] Source type detected and injection starting {sourceType: "iframe", selectedSourceLink: "https://..."}
[15:16:40] [VIDEO] Source injected successfully: anime-1
```

### Error Case with Debug Info
```
[15:16:38] [API] Fetching sources for: Example Title
[15:16:38] [DEBUG] Starting API request {...}
[15:16:40] [DEBUG] API response received {status: 200, duration: "2015ms", responseLength: 0}
[15:16:40] [ERROR] API response text is empty
[15:16:40] [DEBUG] Response validation failed: empty or missing {response: {...}}
[15:16:40] [VIDEO] No external sources found
```

---

## 📋 Debug Mode Reports

### View Full Report
Click **ℹ️ О скрипте (консоль)** button in settings panel to see:
- Complete initialization statistics
- All active settings
- Full execution log table
- Exportable JSON debug data
- Error count and module status

### Example JSON Export
```json
{
  "metadata": {
    "version": "3.6",
    "debugMode": true,
    "timestamp": "2026-02-08T15:16:40.123Z",
    "url": "https://jut.su/ai-no-idenshi/episode-1.html",
    "userAgent": "Mozilla/5.0..."
  },
  "settings": {
    "autoSkip": true,
    "autoNext": true,
    "externalInject": true,
    "debugMode": true
  },
  "logs": [
    {"timestamp": "15:16:38", "category": "[INIT]", "message": "Starting main initialization sequence", "data": null},
    {"timestamp": "15:16:39", "category": "[API]", "message": "Fetching sources...", "data": null}
  ],
  "stats": {
    "totalLogs": 24,
    "errorLogs": 2,
    "activeModules": 5
  }
}
```

---

## 🎛️ Console Commands for Manual Testing

```javascript
// View all logs
console.table(window.alisaLogs);

// View specific category logs
window.alisaLogs.filter(l => l.category.includes('ERROR'));

// Check current settings
console.table(settings);

// Manually trigger API fetch
window.fetchExternalSources('Гены искусственного интеллекта', (results) => {
    console.log('Results:', results);
});

// Test source injection
window.debugMode = true;  // Enable debug output
GM_xmlhttpRequest({...});  // Will log detailed request info

// Export logs as JSON
JSON.stringify({logs: window.alisaLogs, settings}, null, 2);
```

---

## 🐛 Sharing Debug Information

To report issues with detailed debug logs:

1. **Enable Debug Mode**
2. **Reproduce the problem**
3. **Right-click Console** → Select All → Copy
4. **Paste into issue report** or paste.jut.su

**Best Debug Report Includes:**
- [ ] Full console output (DEBUG Mode enabled)
- [ ] Network tab (if API errors)
- [ ] Your settings status
- [ ] Browser/OS information
- [ ] Steps to reproduce

---

## ⚙️ Debug Mode Performance Notes

**When Debug Mode is ON:**
- ✅ Real-time console output (no delay)
- ✅ Detailed data logging
- ✅ Minimal performance impact (< 5ms overhead)
- ⚠️ Console may be cluttered with logs
- ⚠️ Log buffer limited to 1000 entries

**Recommended:**
- Use Debug Mode temporarily for troubleshooting
- Disable for normal viewing (performance & clarity)
- Check logs after problematic episode
- Export logs before page reload

---

## 🚀 Advanced Debug Features

### Automatic Logs on Error
All errors are automatically categorized and logged:
```javascript
// View all errors
window.alisaLogs.filter(log => log.category.includes('ERROR'))
```

### Performance Monitoring
API requests include timing:
```
[DEBUG] API response received {
    status: 200,
    duration: "1023ms",    // Total request time
    responseLength: 2456   // Response size in bytes
}
```

### Feature Initialization Trace
See exactly what initialized and when:
```
[INIT] MutationObserver 'autoSkipObserver' created
[INIT] Observer 'autoSkipObserver' attached to DOM
[INIT] Initializing External Source Injection
[INIT] All 5 feature modules initialized
```

---

## 📞 Support & Issues

**Debug Mode helps with:**
- API connection issues
- Source injection failures
- Settings not persisting
- Feature initialization problems
- Performance troubleshooting

**Disable Debug Mode if:**
- Console is too cluttered
- Testing normal performance
- Sharing screenshots (logs may be sensitive)

---

**Jut.su Auto+ v3.6 — Enhanced with comprehensive Debug Mode**  
Last Updated: February 8, 2026
