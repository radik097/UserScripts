// ==UserScript==
// @name            Jut.su АвтоСкип+ (Ultimate Edition by description009)
// @name:en         Jut.su Auto+ (Skip Intro, Next Episode, Preview, Download + External Sources)
// @namespace       http://tampermonkey.net/
// @version         3.8.3
// @description     Автоскип заставок, автопереход, предпросмотр серий, кнопка загрузки, интеграция внешних видео-ссылок, модальное окно выбора источников и панель настроек
// @description:en  Auto-skip intros, next episode, previews, download button, external sources with source picker modal and settings panel
// @author          Rodion (integrator), Diorhc (preview), VakiKrin (download), nab (external sources), Alisa (refactoring, logging & architecture)
// @match           https://jut.su/*
// @license         MIT
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_xmlhttpRequest
// @require         https://update.greasyfork.org/scripts/565619/1541178/Jut%20su%20Auto%2B%20Core%20Library.js
// @downloadURL     https://github.com/radik097/UserScripts/raw/refs/heads/main/jutsu+/Jut.su-AutoSkipPlus.user.js
// @updateURL       https://github.com/radik097/UserScripts/raw/refs/heads/main/jutsu+/Jut.su-AutoSkipPlus.user.js
// @connect         andb.workers.dev
// @connect         consumet-api-yij6.onrender.com
// @run-at          document-start
// ==/UserScript==
 
(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════════
    // LOGGING INFRASTRUCTURE (Enhanced with Debug Mode)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const Core = window.JutsuCore;
    if (!Core) {
        console.error('JutsuCore.lib.js not loaded');
        return;
    }
    window.debugMode = GM_getValue('debugMode', false);
    Core.setDebugMode(window.debugMode);
    
    function alisaLog(category, message, data = null) {
        Core.log(category, message, data);
    }
    
    function debugLog(message, details = null) {
        Core.debug(message, details);
    }
    
    function alisaFlushLogs() {
        Core.flushLogs();
    }
    
    window.addEventListener('load', alisaFlushLogs);

    // ═══════════════════════════════════════════════════════════════════════════════
    // MUTATION OBSERVER MANAGER (Prevent memory leaks)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const observerManager = Core.observerManager;
    
    window.addEventListener('beforeunload', () => observerManager.disconnectAll());

    // ═══════════════════════════════════════════════════════════════════════════════
    // ERROR HANDLING & VALIDATION HELPERS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    function validateAPIResponse(response) {
        if (!response || !response.responseText) {
            if (window.debugMode) debugLog('Response validation failed: empty or missing');
            return null;
        }
        
        const text = response.responseText.trim();
        if (!text) {
            if (window.debugMode) debugLog('Response text is empty after trim');
            return null;
        }
        
        // Check HTTP status
        if (response.status && (response.status >= 400 && response.status < 600)) {
            if (window.debugMode) debugLog(`HTTP Error ${response.status}`, { responseLength: text.length });
            return null;
        }
        
        // Try to parse JSON
        try {
            const parsed = JSON.parse(text);
            if (window.debugMode) {
                const resultCount = parsed.results?.length || parsed.data?.results?.length || 0;
                debugLog('✓ JSON parsed', { status: response.status, contentLength: text.length, resultCount: resultCount });
            }
            return parsed;
        } catch (e) {
            if (window.debugMode) debugLog('JSON parse error', { error: e.message });
            return null;
        }
    }
    
    function assertElement(selector, context = document) {
        const element = context.querySelector(selector);
        if (!element) {
            alisaLog('[ERROR]', `Element not found: ${selector}`);
        }
        return element;
    }
    
    function sanitizeTitle(title) {
        return title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }
    
    function getEpisodeInfo() {
        return Core.getEpisodeInfo();
    }

    function buildTitleVariants(rawTitle, episode) {
        return Core.buildTitleVariants(rawTitle, episode);
    }

    function getProviderOrder(primary) {
        const order = PROVIDER_ORDER.slice();
        const normalized = order.includes(primary) ? primary : 'consumet';
        return [normalized, ...order.filter((item) => item !== normalized)];
    }

    function guessMimeType(url) {
        const lower = (url || '').toLowerCase();
        if (lower.includes('.m3u8')) return 'application/x-mpegURL';
        if (lower.includes('.mp4')) return 'video/mp4';
        return 'video/mp4';
    }

    function pickEpisode(episodes, episodeNumber) {
        return Core.pickEpisode(episodes, episodeNumber);
    }

    function buildUrlMapFromSources(sources) {
        return Core.buildUrlMapFromSources(sources);
    }

    function gmRequestJson(url, contextLabel, retries = 2) {
        return Core.gmRequestJson(url, contextLabel, retries);
    }
 
    // ═══════════════════════════════════════════════════════════════════════════════
    // SETTINGS MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const settings = {
        autoSkip: GM_getValue('autoSkip', true),
        autoNext: GM_getValue('autoNext', true),
        previewEnabled: GM_getValue('previewEnabled', true),
        downloadButton: GM_getValue('downloadButton', true),
        externalInject: GM_getValue('externalInject', true),
        debugMode: GM_getValue('debugMode', false),
        providerPrimary: GM_getValue('providerPrimary', 'consumet')
    };
    
    const API_URL = 'https://api.andb.workers.dev/search';
    const API_TIMEOUT = 5000;
    const PROVIDER_BASE_URLS = {
        consumet: 'https://consumet-api-yij6.onrender.com'
    };
    const PROVIDER_ORDER = ['consumet'];
    const PROVIDER_HEALTH_ENDPOINTS = {
        consumet: 'https://consumet-api-yij6.onrender.com/anime/gogoanime/naruto?page=1'
    };
    const CONSUMET_PROVIDERS = ['gogoanime', 'animekai', 'aniwatch'];
    const CONSUMET_SERVERS = ['hd-1', 'vidstreaming', 'megacloud'];
    const CONSUMET_CATEGORIES = ['sub', 'dub', 'raw'];
    const PROVIDER_HEALTH_TTL = 5 * 60 * 1000;
    const PROVIDER_HEALTH_TIMEOUT = 3500;
    const providerHealthCache = new Map();

    Core.setConfig({
        baseUrl: PROVIDER_BASE_URLS.consumet,
        retries: 2,
        timeout: API_TIMEOUT,
        providers: CONSUMET_PROVIDERS,
        servers: CONSUMET_SERVERS,
        categories: CONSUMET_CATEGORIES
    });
    
    function updateSetting(key, value) {
        settings[key] = value;
        GM_setValue(key, value);
        
        // Special handling for Debug Mode
        if (key === 'debugMode') {
            window.debugMode = value;
            Core.setDebugMode(value);
            debugLog(`Debug Mode ${value ? 'ENABLED' : 'DISABLED'}`, { 
                timestamp: new Date().toISOString(),
                logsCount: window.alisaLogs.length
            });
            if (value) {
                console.log('%c╔════════════════════════════════════╗', 'color: #ff9800; font-weight: bold;');
                console.log('%c║  🔧 DEBUG MODE IS NOW ENABLED  🔧  ║', 'background: #ff9800; color: #fff; padding: 2px 6px; font-weight: bold;');
                console.log('%c║  All operations will be logged now  ║', 'color: #ff9800; font-weight: bold;');
                console.log('%c╚════════════════════════════════════╝', 'color: #ff9800; font-weight: bold;');
            }
        }
        
        alisaLog('[INIT]', `Setting updated: ${key} = ${value}`);
        updateMenuCommands();
        updateSettingsPanel();
    }

    function cycleProviderPrimary() {
        updateSetting('providerPrimary', 'consumet');
        showAlisaNotify('Провайдер источников: consumet');
    }
    
    function registerMenu() {
        GM_registerMenuCommand(`🎬 Jut.su Auto+ — Панель настроек`, () => toggleSettingsPanel());
        const sep1 = GM_registerMenuCommand('────────────────────', () => {});
        GM_registerMenuCommand(`Автоскип: ${settings.autoSkip ? '✅' : '❌'}`, () => updateSetting('autoSkip', !settings.autoSkip));
        GM_registerMenuCommand(`Автопереход: ${settings.autoNext ? '✅' : '❌'}`, () => updateSetting('autoNext', !settings.autoNext));
        GM_registerMenuCommand(`Превью: ${settings.previewEnabled ? '✅' : '❌'}`, () => updateSetting('previewEnabled', !settings.previewEnabled));
        GM_registerMenuCommand(`Загрузка: ${settings.downloadButton ? '✅' : '❌'}`, () => updateSetting('downloadButton', !settings.downloadButton));
        GM_registerMenuCommand(`Внешн. источники: ${settings.externalInject ? '✅' : '❌'}`, () => updateSetting('externalInject', !settings.externalInject));
        GM_registerMenuCommand('Провайдер: consumet', () => cycleProviderPrimary());
        const sep2 = GM_registerMenuCommand('────────────────────', () => {});
        GM_registerMenuCommand(`🔧 Debug Mode: ${settings.debugMode ? '🟢 ON' : '⚫ OFF'}`, () => updateSetting('debugMode', !settings.debugMode));
    }
    
    function updateMenuCommands() {
        // Note: Tampermonkey doesn't support menu command removal, so we catch updates in panel
        alisaLog('[UI]', 'Menu commands updated via setting change');
    }
 
    // ═══════════════════════════════════════════════════════════════════════════════
    // DOM STYLES & UI HELPERS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    function injectGlobalStyles() {
        const style = document.createElement('style');
        style.id = 'alisa-styles';
        style.textContent = `
            /* Hide Jutsu+ paywall elements */
            .tab_need_plus, .video_plate_need_plus, .premium_low_notice, #vjs-sharing-overlay { 
                display: none !important; 
            }
            
            /* Notification */
            .alisa-notify {
                position: fixed; top: 20px; right: 20px; z-index: 100000; 
                background: #1a1a1a; color: #fff; padding: 12px 18px; 
                border-radius: 10px; font-size: 13px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.4); 
                border-left: 4px solid #4caf50;
                transition: opacity 0.3s; pointer-events: auto; opacity: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            /* Preview Box */
            .alisa-prevbox {
                position: absolute; z-index: 9999; width: 220px; 
                background: #2a2c2b; border: 2px solid #4caf50; 
                border-radius: 8px; pointer-events: none; display: none;
                box-shadow: 0 8px 20px rgba(0,0,0,0.5); overflow: hidden;
            }
            .alisa-prevbox img { 
                width: 100%; height: auto; display: block; 
                background: #000;
            }
            .alisa-prevbox div { 
                padding: 6px; color: #eee; font-size: 11px; 
                text-align: center; background: #1a1a1a;
            }
            
            /* Buttons */
            .alisa-btn-wrap { 
                margin: 15px 0; display: flex; justify-content: center; 
                gap: 10px; flex-wrap: wrap;
            }
            .alisa-btn {
                background: #388e3c; color: #fff; border: none; 
                padding: 8px 16px; border-radius: 6px; cursor: pointer; 
                font-weight: bold; font-size: 13px; transition: background 0.2s;
            }
            .alisa-btn:hover { background: #2e7d32; }
            .alisa-btn.secondary { background: #444; }
            .alisa-btn.secondary:hover { background: #555; }
            
            /* Settings Panel */
            .alisa-panel-toggle {
                position: fixed; top: 15px; right: 15px; z-index: 90000;
                width: 40px; height: 40px; background: #4caf50; 
                border-radius: 50%; cursor: pointer; display: flex;
                align-items: center; justify-content: center; color: #fff;
                font-size: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s; font-weight: bold;
            }
            .alisa-panel-toggle:hover { 
                background: #45a049; box-shadow: 0 6px 16px rgba(0,0,0,0.4); 
            }
            
            .alisa-settings-panel {
                position: fixed; top: 60px; right: 15px; z-index: 90001;
                width: 280px; background: #2a2c2b; border: 2px solid #4caf50;
                border-radius: 8px; padding: 15px; color: #fff;
                box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                max-height: 80vh; overflow-y: auto;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: none;
            }
            .alisa-settings-panel.active { display: block; }
            
            .alisa-panel-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 10px;
                font-weight: bold; font-size: 14px;
            }
            .alisa-panel-close {
                background: none; border: none; color: #888; cursor: pointer;
                font-size: 20px; padding: 0; line-height: 1;
            }
            .alisa-panel-close:hover { color: #ccc; }
            
            .alisa-setting-item {
                display: flex; justify-content: space-between; align-items: center;
                padding: 8px 0; margin: 8px 0; border-bottom: 1px solid #333;
                cursor: pointer; user-select: none;
            }
            .alisa-setting-label { font-size: 12px; color: #bbb; pointer-events: none; }
            .alisa-toggle {
                width: 36px; height: 20px; background: #444; 
                border-radius: 10px; cursor: pointer; position: relative;
                transition: background 0.3s; border: none; padding: 4px;
                pointer-events: auto; flex-shrink: 0;
            }
            .alisa-toggle.active { background: #4caf50; }
            .alisa-toggle::after {
                content: ''; position: absolute; width: 16px; height: 16px;
                background: #fff; border-radius: 50%; top: 2px; left: 2px;
                transition: left 0.3s;
            }
            .alisa-toggle.active::after { left: 18px; }

            .alisa-select {
                width: 100%; padding: 6px 8px; background: #1a1a1a; color: #fff;
                border: 1px solid #444; border-radius: 6px; font-size: 12px;
                margin-top: 6px;
            }
            
            /* Modal for Source Selection */
            .alisa-modal {
                display: none; position: fixed; top: 0; left: 0; 
                width: 100%; height: 100%; background: rgba(0,0,0,0.7);
                z-index: 95000; justify-content: center; align-items: center;
            }
            .alisa-modal.show { display: flex; }
            
            .alisa-modal-content {
                background: #2a2c2b; border: 2px solid #4caf50;
                border-radius: 8px; padding: 20px; color: #fff;
                width: 90%; max-width: 500px; max-height: 80vh;
                overflow-y: auto; box-shadow: 0 12px 40px rgba(0,0,0,0.7);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .alisa-modal-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #444;
            }
            .alisa-modal-title { font-size: 16px; font-weight: bold; }
            .alisa-modal-close {
                background: none; border: none; color: #888; cursor: pointer;
                font-size: 22px; padding: 0; line-height: 1;
            }
            .alisa-modal-close:hover { color: #ccc; }
            
            .alisa-modal-search {
                width: 100%; padding: 8px; margin-bottom: 12px;
                background: #1a1a1a; border: 1px solid #444; color: #fff;
                border-radius: 4px; font-size: 12px;
            }
            .alisa-modal-search::placeholder { color: #666; }
            
            .alisa-modal-list { display: flex; flex-direction: column; gap: 8px; }
            .alisa-modal-item {
                padding: 10px; background: #1a1a1a; border: 1px solid transparent;
                border-radius: 4px; cursor: pointer; transition: all 0.2s;
                font-size: 12px; position: relative;
            }
            .alisa-modal-item:hover { 
                background: #333; border-color: #4caf50; 
            }
            .alisa-modal-item.selected {
                background: #4caf50; color: #000; font-weight: bold;
            }
            .alisa-modal-item-title { font-weight: bold; margin-bottom: 3px; }
            .alisa-modal-item-info { color: #999; font-size: 11px; }
            
            /* No Sources Found Block */
            .alisa-no-sources-block {
                position: relative; width: 100%; height: auto; background: #1a1a1a;
                border: 2px solid #ff6b6b; border-radius: 8px; padding: 30px;
                color: #fff; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: inset 0 0 15px rgba(255, 107, 107, 0.1);
                margin: 20px 0;
            }
            .alisa-no-sources-title {
                font-size: 24px; font-weight: bold; color: #ff6b6b; margin-bottom: 15px;
                display: flex; align-items: center; justify-content: center; gap: 10px;
            }
            .alisa-no-sources-message {
                font-size: 14px; color: #bbb; margin-bottom: 15px; line-height: 1.6;
            }
            .alisa-no-sources-details {
                background: #2a2c2b; border: 1px solid #444; border-radius: 6px; padding: 15px;
                margin: 15px 0; text-align: left; font-size: 12px; color: #aaa;
                max-height: 200px; overflow-y: auto;
            }
            .alisa-no-sources-code {
                background: #1a1a1a; border-left: 3px solid #4caf50; padding: 8px 12px;
                margin: 8px 0; font-family: 'Courier New', monospace; font-size: 11px;
                color: #4caf50; word-break: break-all;
            }
            .alisa-no-sources-buttons {
                display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px;
            }
            .alisa-no-sources-btn {
                background: #4caf50; color: #fff; border: none;
                padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;
                font-size: 13px; transition: background 0.2s;
            }
            .alisa-no-sources-btn:hover { background: #45a049; }
            .alisa-no-sources-btn.secondary { background: #444; color: #fff; }
            .alisa-no-sources-btn.secondary:hover { background: #555; }
            
            /* Search Progress Bar */
            .alisa-search-progress {
                position: fixed; top: 0; left: 0; right: 0; z-index: 999999;
                height: 4px; background: #1a1a1a; overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.6);
                transition: opacity 0.5s ease-out;
            }
            .alisa-search-progress-fill {
                width: 0%; height: 100%;
                background: linear-gradient(90deg, #4caf50, #81c784, #4caf50);
                background-size: 200% 100%;
                animation: alisaProgressFlow 2.5s linear infinite;
                transition: width 0.4s ease-out;
            }
            .alisa-search-progress-text {
                position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.75); color: #fff; padding: 6px 14px;
                border-radius: 6px; font-size: 13px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 2px 10px rgba(0,0,0,0.5); white-space: nowrap;
                z-index: 9999999; pointer-events: none;
            }
            @keyframes alisaProgressFlow {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
            }
        `;
        document.head.appendChild(style);
        alisaLog('[UI]', 'Global styles injected');
    }
    
    function showAlisaNotify(msg, duration = 3000) {
        let notify = document.querySelector('.alisa-notify');
        if (!notify) {
            notify = document.createElement('div');
            notify.className = 'alisa-notify';
            document.body.appendChild(notify);
        }
        notify.textContent = msg;
        notify.style.opacity = '1';
        setTimeout(() => {
            notify.style.opacity = '0';
        }, duration);
    }
    
    function showSearchProgress(totalAttempts, currentAttempt = 0, message = 'Поиск источников...') {
        const existing = document.querySelector('.alisa-search-progress');
        if (existing) existing.remove();
        const existingText = document.querySelector('.alisa-search-progress-text');
        if (existingText) existingText.remove();
        
        const progressBar = document.createElement('div');
        progressBar.className = 'alisa-search-progress';
        
        const fill = document.createElement('div');
        fill.className = 'alisa-search-progress-fill';
        
        const text = document.createElement('div');
        text.className = 'alisa-search-progress-text';
        
        progressBar.appendChild(fill);
        document.body.appendChild(progressBar);
        document.body.appendChild(text);

        const update = (attempt) => {
            const safeTotal = Math.max(totalAttempts, 1);
            const percent = Math.min(100, Math.round((attempt / safeTotal) * 100));
            fill.style.width = `${percent}%`;
            text.textContent = `${message} ${attempt}/${safeTotal} попыток (${percent}%)`;
        };

        const complete = (success, finalMessage) => {
            fill.style.background = success ? '#4caf50' : '#f44336';
            fill.style.animation = 'none';
            text.textContent = finalMessage;
            setTimeout(() => {
                progressBar.style.opacity = '0';
                text.style.opacity = '0';
                setTimeout(() => {
                    progressBar.remove();
                    text.remove();
                }, 500);
            }, 1200);
        };

        update(currentAttempt);
        return { update, complete };
    }
    
    function toggleSettingsPanel() {
        const panel = document.querySelector('.alisa-settings-panel');
        if (panel) {
            panel.classList.toggle('active');
        }
    }
    
    function updateSettingsPanel() {
        const panel = document.querySelector('.alisa-settings-panel');
        if (!panel) return;
        
        Object.entries(settings).forEach(([key, value]) => {
            const toggle = panel.querySelector(`[data-setting="${key}"]`);
            if (toggle) {
                toggle.classList.toggle('active', value);
            }
        });

        const providerSelect = panel.querySelector('[data-provider-select]');
        if (providerSelect) {
            providerSelect.value = 'consumet';
        }
    }

 
    // ═══════════════════════════════════════════════════════════════════════════════
    // SOURCE INJECTION (With Auto-Detection & Error Handling)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    window.alisaSourceType = null; // Cache detection result
    
    function detectSourceType(animeData) {
        // If already cached, return cached result
        if (window.alisaSourceType) {
            return window.alisaSourceType;
        }
        
        // Detect if API returns direct URLs or only iframes
        const link = animeData.link || '';
        const hasDirectLink = link.includes('.mp4') || link.includes('.mkv') || link.includes('.m3u8');
        const hasIframe = link.includes('http') && !hasDirectLink;
        
        const detected = hasDirectLink ? 'direct' : 'iframe';
        window.alisaSourceType = detected;
        alisaLog('[VIDEO]', `Source type detected: ${detected}`);
        return detected;
    }
    
    function injectDirectSources(videoElement, urls, qualities = ['1080p', '720p', '480p', '360p']) {
        try {
            debugLog('injectDirectSources called', {
                urlCount: Object.keys(urls).length,
                qualityLevels: qualities,
                videoElementId: videoElement.id
            });
            
            const container = videoElement.parentElement;
            const sourceContainer = videoElement.querySelector('source') ? videoElement : container.querySelector('video');
            
            if (!sourceContainer) {
                alisaLog('[ERROR]', 'Could not find video or source container for direct injection');
                debugLog('Source container not found', {
                    hasQuerySelector: !!videoElement.querySelector,
                    parentFound: !!container
                });
                return false;
            }
            
            // Clear existing sources
            const existingSources = sourceContainer.querySelectorAll('source');
            debugLog(`Cleared ${existingSources.length} existing sources`, {
                sourceCount: existingSources.length
            });
            existingSources.forEach(src => src.remove());
            
            // Inject new sources
            let injectedCount = 0;
            qualities.forEach((quality) => {
                const source = document.createElement('source');
                const url = urls[quality] || urls['default'] || Object.values(urls)[0];
                if (url) {
                    source.src = url;
                    source.type = guessMimeType(url);
                    source.dataset.quality = quality;
                    sourceContainer.appendChild(source);
                    injectedCount++;
                    debugLog(`Source element created and injected`, {
                        quality: quality,
                        url: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
                        type: source.type
                    });
                    alisaLog('[VIDEO]', `Source injected: ${quality} → ${url.substring(0, 50)}...`);
                }
            });
            
            debugLog(`Total sources injected: ${injectedCount}/${qualities.length}`);
            
            // Reload video player
            if (sourceContainer.load) {
                sourceContainer.load();
                debugLog('Video player reloaded');
            }
            
            return true;
        } catch (e) {
            alisaLog('[ERROR]', 'Direct source injection failed', { error: e.message });
            debugLog('Exception during direct source injection', {
                error: e.message,
                stack: e.stack?.substring(0, 200)
            });
            return false;
        }
    }
    
    function injectIframeSource(container, iframeUrl, title = '') {
        try {
            const target = document.evaluate(
                '/html/body/div[5]/div[1]/div/div/div[4]',
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (!target || !target.parentNode) {
                alisaLog('[ERROR]', 'Iframe injection target not found by XPath');
                debugLog('Iframe injection target missing', { xpath: '/html/body/div[5]/div[1]/div/div/div[4]' });
                return false;
            }

            debugLog('injectIframeSource called', {
                url: iframeUrl.substring(0, 100) + (iframeUrl.length > 100 ? '...' : ''),
                title: title
            });

            const iframe = document.createElement('iframe');
            iframe.src = iframeUrl;
            iframe.style.cssText = 'width:100%; height:100%; border:none; background:#000;';
            iframe.allow = 'fullscreen; autoplay; encrypted-media';
            iframe.title = title || 'Video Player';

            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'width: 100%; height: 100%; position: relative; background: #000;';
            wrapper.appendChild(iframe);

            target.parentNode.replaceChild(wrapper, target);

            alisaLog('[VIDEO]', `Iframe injected: ${iframeUrl.substring(0, 50)}...`);
            return true;
        } catch (e) {
            alisaLog('[ERROR]', 'Iframe injection failed', { error: e.message });
            debugLog('Exception during iframe injection', {
                error: e.message,
                stack: e.stack?.substring(0, 200)
            });
            return false;
        }
    }
    
    async function fetchOriginalTitle() {
        return Core.fetchOriginalTitle();
    }
    
    async function fetchConsumetResults(title, episode) {
        return Core.fetchConsumetResults(title, episode);
    }

    async function fetchProviderResults(providerKey, title, episode) {
        if (providerKey === 'consumet') return fetchConsumetResults(title, episode);
        return [];
    }
    
    function checkProviderHealth(providerKey) {
        const endpoint = PROVIDER_HEALTH_ENDPOINTS[providerKey];
        if (!endpoint) return Promise.resolve(true);
        const cached = providerHealthCache.get(providerKey);
        if (cached && Date.now() - cached.timestamp < PROVIDER_HEALTH_TTL) {
            return Promise.resolve(cached.available);
        }
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: endpoint,
                timeout: PROVIDER_HEALTH_TIMEOUT,
                headers: {
                    'User-Agent': navigator.userAgent,
                    'Referer': 'https://jut.su/',
                    'Origin': 'https://jut.su',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                onload: (response) => {
                    const ok = response.status >= 200 && response.status < 500;
                    providerHealthCache.set(providerKey, {
                        available: ok,
                        timestamp: Date.now(),
                        status: response.status
                    });
                    if (!ok) {
                        alisaLog('[API]', `⚠️ ${providerKey} health check failed (${response.status})`);
                    }
                    if (window.debugMode) {
                        debugLog('Provider health check', {
                            provider: providerKey,
                            status: response.status,
                            available: ok
                        });
                    }
                    resolve(ok);
                },
                onerror: (error) => {
                    providerHealthCache.set(providerKey, {
                        available: false,
                        timestamp: Date.now(),
                        status: 'error'
                    });
                    if (window.debugMode) {
                        debugLog('Provider health error', {
                            provider: providerKey,
                            error: error?.error?.message || error?.message || 'Unknown network error'
                        });
                    }
                    resolve(false);
                },
                ontimeout: () => {
                    providerHealthCache.set(providerKey, {
                        available: false,
                        timestamp: Date.now(),
                        status: 'timeout'
                    });
                    if (window.debugMode) {
                        debugLog('Provider health timeout', { provider: providerKey });
                    }
                    resolve(false);
                }
            });
        });
    }
    
    async function getAvailableProviders(order) {
        const checks = await Promise.all(order.map(async (providerKey) => ({
            providerKey,
            available: await checkProviderHealth(providerKey)
        })));
        const available = checks.filter((item) => item.available).map((item) => item.providerKey);
        if (!available.length) {
            alisaLog('[ERROR]', 'No providers available after health checks');
        }
        return available;
    }

    function fetchExternalSources(titleOrTitles, callback) {
        const { episode } = getEpisodeInfo();
        const titles = Array.isArray(titleOrTitles)
            ? titleOrTitles.filter(Boolean)
            : buildTitleVariants(titleOrTitles, episode);

        if (!titles.length) {
            alisaLog('[VIDEO]', 'No title available for external sources');
            showAlisaNotify('⚠️ Не удалось определить название для поиска источников');
            callback(null);
            return;
        }

        (async () => {
            const providerOrder = getProviderOrder(settings.providerPrimary);
            showAlisaNotify('🔍 Проверка доступности источников...');
            const availableProviders = await getAvailableProviders(providerOrder);
            if (!availableProviders.length) {
                showAlisaNotify('⚠️ Внешние источники недоступны, используется оригинальный плеер');
                callback(null);
                return;
            }
            const totalAttempts = titles.length * availableProviders.length;
            const progress = showSearchProgress(totalAttempts, 0, 'Поиск источников...');
            
            alisaLog('[API]', `🔍 Searching for sources (${titles.length} title variants, ${availableProviders.length} providers)`);
            showAlisaNotify('🔍 Поиск источников... пожалуйста, подождите');

            let attemptCount = 0;
            const foundAnimeLog = [];
            
            for (const providerKey of availableProviders) {
                for (const title of titles) {
                    attemptCount++;
                    progress.update(attemptCount);
                    if (window.debugMode) {
                        debugLog(`[${attemptCount}/${totalAttempts}] Trying provider`, { 
                            provider: providerKey, 
                            title: title.substring(0, 50) + (title.length > 50 ? '...' : '') 
                        });
                    }

                    const results = await fetchProviderResults(providerKey, title, episode);
                    const validResults = (results || []).filter((item) => item?.link || item?.urls?.default);
                    if (validResults.length) {
                        // Build detailed anime list log
                        const animeList = validResults.map((r, idx) => `${idx + 1}. ${r.title || r.id} (${r.quality || 'auto'})`).join('; ');
                        
                        alisaLog('[API]', `✅ Found ${validResults.length} source(s) via ${providerKey}`);
                        alisaLog('[API]', `📺 Anime sources: ${animeList}`);
                        
                        debugLog('🎯 Source search SUCCESSFUL', { 
                            provider: providerKey, 
                            usedTitle: title,
                            resultsCount: validResults.length,
                            animeList: validResults.map(r => ({ title: r.title, quality: r.quality, type: r.type })),
                            attempts: attemptCount,
                            attemptPercentage: `${Math.round((attemptCount / totalAttempts) * 100)}%`
                        });
                        progress.complete(true, 'Источники найдены! Загружаем…');
                        callback(validResults, title, providerKey);
                        return;
                    }
                }
            }

            // No sources found after all attempts
            progress.complete(false, 'Источники не найдены, используется оригинал');
            alisaLog('[VIDEO]', '❌ No external sources found after exhausting all providers');
            alisaLog('[VIDEO]', `Tried ${totalAttempts} combinations: ${availableProviders.length} providers × ${titles.length} title variants`);
            showAlisaNotify('ℹ️ Внешние источники не найдены, используется оригинальный плеер');
            debugLog('⚠️  Source search EXHAUSTED', { 
                totalAttempts: totalAttempts, 
                providers: availableProviders, 
                titleVariants: titles.length,
                message: 'All fallback combinations exhausted'
            });
            callback(null);
        })();
    }
    
    function renderNoSourcesBlock(title, episode, storageKey) {
        const container = assertElement('.post_media') || assertElement('.post_content') || assertElement('video')?.parentElement;
        if (!container) return;
        
        // Remove any existing no-sources block
        const existingBlock = container.querySelector('.alisa-no-sources-block');
        if (existingBlock) existingBlock.remove();
        
        const block = document.createElement('div');
        block.className = 'alisa-no-sources-block';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'alisa-no-sources-title';
        titleDiv.innerHTML = '❌ Источники не найдены';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'alisa-no-sources-message';
        messageDiv.innerHTML = `
            <span>К сожалению, внешние ссылки на аниме <strong>"${title.substring(0, 60)}${title.length > 60 ? '...' : ''}"</strong> не найдены.</span>
            <br><br>
            <span>Это может означать:</span>
        `;
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'alisa-no-sources-details';
        detailsDiv.innerHTML = `
            <div style="margin-bottom: 8px;">📺 <strong>Возможные причины:</strong></div>
            <div>• Аниме еще не добавлено в базу провайдера (Consumet)</div>
            <div>• Название аниме не совпадает с названиями в базах</div>
            <div>• API провайдеров временно недоступны или возвращают ошибки</div>
            <div>• Эпизод еще не загружен на внешних источниках</div>
            <br>
            <div style="margin-bottom: 8px;">🔄 <strong>Что попробовать:</strong></div>
            <div>• Обновите страницу и повторите попытку</div>
            <div>• Используйте оригинальный плеер Jut.su</div>
            <div>• Включите Debug Mode в панели настроек для подробных логов</div>
            <div>• Проверьте консоль браузера (F12) для большей информации</div>
            <br>
            <div style="margin-bottom: 8px;">📝 <strong>Информация о поиске:</strong></div>
            <div>Названия опробованы: <strong>${title}</strong></div>
            <div>Установка: Эпизод <strong>${episode || '—'}</strong>, Сезон <strong>N/A</strong></div>
        `;
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'alisa-no-sources-buttons';
        
        const retryBtn = document.createElement('button');
        retryBtn.className = 'alisa-no-sources-btn';
        retryBtn.textContent = '🔄 Повторить поиск';
        retryBtn.addEventListener('click', () => {
            location.reload();
        });
        
        const debugBtn = document.createElement('button');
        debugBtn.className = 'alisa-no-sources-btn secondary';
        debugBtn.textContent = '🔧 Включить Debug Mode';
        debugBtn.addEventListener('click', () => {
            updateSetting('debugMode', true);
            showAlisaNotify('✅ Debug Mode включен! Смотрите консоль (F12)');
        });
        
        buttonsDiv.appendChild(retryBtn);
        buttonsDiv.appendChild(debugBtn);
        
        block.appendChild(titleDiv);
        block.appendChild(messageDiv);
        block.appendChild(detailsDiv);
        block.appendChild(buttonsDiv);
        
        const mediaContainer = document.querySelector('.post_media');
        const videoNode = document.querySelector('video');
        const anchorNode = mediaContainer || videoNode;
        const anchorParent = anchorNode?.parentNode;
        if (anchorNode && anchorParent) {
            anchorParent.insertBefore(block, anchorNode.nextSibling);
        } else {
            container.appendChild(block);
        }
        
        alisaLog('[UI]', 'No sources found block rendered');
        debugLog('No sources block displayed for user', { title: title });
    }
    
    function renderSourceModal(results, title, episode) {
        if (!results || !results.length) return;
        
        if (document.querySelector('.alisa-modal')) {
            document.querySelector('.alisa-modal').remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'alisa-modal show';
        
        const search = document.createElement('input');
        search.type = 'text';
        search.className = 'alisa-modal-search';
        search.placeholder = 'Поиск по названию или озвучке...';
        
        const list = document.createElement('div');
        list.className = 'alisa-modal-list';
        
        const storageKey = `alisa_src_${sanitizeTitle(title)}`;
        const savedId = localStorage.getItem(storageKey);
        
        const renderItems = (items) => {
            list.innerHTML = '';
            items.forEach((result) => {
                const item = document.createElement('div');
                item.className = `alisa-modal-item ${result.id === savedId ? 'selected' : ''}`;
                item.dataset.resultId = result.id;
                
                const titleDiv = document.createElement('div');
                titleDiv.className = 'alisa-modal-item-title';
                titleDiv.textContent = result.title || result.id;
                
                const infoDiv = document.createElement('div');
                infoDiv.className = 'alisa-modal-item-info';
                const providerLabel = result.provider ? ` • ${result.provider}` : '';
                infoDiv.textContent = `Источник: ${result.type || 'anime'}${providerLabel} • Кач: ${result.quality || 'mixed'}`;
                
                item.appendChild(titleDiv);
                item.appendChild(infoDiv);
                
                item.addEventListener('click', () => {
                    localStorage.setItem(storageKey, result.id);
                    list.querySelectorAll('.alisa-modal-item').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                    alisaLog('[UI]', `Source selected: ${result.id}`);
                    setTimeout(() => {
                        modal.classList.remove('show');
                        setTimeout(() => modal.remove(), 300);
                        location.reload();
                    }, 300);
                });
                
                list.appendChild(item);
            });
        };
        
        renderItems(results);
        
        search.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = results.filter(r => (r.title || r.id).toLowerCase().includes(query));
            renderItems(filtered);
        });
        
        const header = document.createElement('div');
        header.className = 'alisa-modal-header';
        const titleDiv = document.createElement('div');
        titleDiv.className = 'alisa-modal-title';
        titleDiv.textContent = `Выбрать источник • ${title}`;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'alisa-modal-close';
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        header.appendChild(titleDiv);
        header.appendChild(closeBtn);
        
        const content = document.createElement('div');
        content.className = 'alisa-modal-content';
        content.appendChild(header);
        content.appendChild(search);
        content.appendChild(list);
        
        modal.appendChild(content);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        });
        
        document.body.appendChild(modal);
        search.focus();
        alisaLog('[UI]', `Modal rendered with ${results.length} source(s)`);
    }
    
    function renderSourceButtons(results, title, episode, storageKey) {
        if (document.querySelector('.alisa-btn-wrap')) return;
        
        const target = assertElement('.post_media') || assertElement('.post_content');
        if (!target) return;
        
        const wrap = document.createElement('div');
        wrap.className = 'alisa-btn-wrap';
        
        const changeBtn = document.createElement('button');
        changeBtn.className = 'alisa-btn';
        changeBtn.textContent = '🎨 Выбрать другой источник/озвучку';
        changeBtn.addEventListener('click', () => renderSourceModal(results, title, episode));
        
        const resetBtn = document.createElement('button');
        resetBtn.className = 'alisa-btn secondary';
        resetBtn.textContent = '↻ Сбросить выбор';
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem(storageKey);
            location.reload();
        });
        
        wrap.appendChild(changeBtn);
        wrap.appendChild(resetBtn);
        target.parentElement.insertBefore(wrap, target.nextElementSibling);
        
        alisaLog('[UI]', 'Source selection buttons rendered');
    }

 
    // ═══════════════════════════════════════════════════════════════════════════════
    // AUTO-SKIP FEATURE MODULE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    function initAutoSkip() {
        if (!settings.autoSkip) {
            alisaLog('[INIT]', 'AutoSkip is disabled');
            return { disconnect: () => {} };
        }
        
        alisaLog('[INIT]', 'Initializing AutoSkip');
        
        const observer = observerManager.create('autoSkipObserver', () => {
            if (!settings.autoSkip) return;
            
            const skipBtn = document.querySelector("div[title*='пропустить заставку'], button[title*='Skip']");
            if (skipBtn && skipBtn.offsetParent !== null) {
                skipBtn.click();
                alisaLog('[SKIP]', 'Skip button clicked automatically');
            }
        });
        
        observerManager.observe('autoSkipObserver');
        
        return { disconnect: () => observerManager.disconnect('autoSkipObserver') };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // AUTO-NEXT FEATURE MODULE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    function initAutoNext() {
        if (!settings.autoNext) {
            alisaLog('[INIT]', 'AutoNext is disabled');
            return { disconnect: () => {} };
        }
        
        alisaLog('[INIT]', 'Initializing AutoNext');
        
        // Method 1: Video ended event
        const handleEnded = (e) => {
            if (e.target.tagName === 'VIDEO' && settings.autoNext) {
                const nextLink = document.querySelector('.vnright a, a[href*="/season-"][href*="/episode-"]');
                if (nextLink) {
                    alisaLog('[NEXT]', `Auto-navigating to next episode: ${nextLink.href}`);
                    setTimeout(() => {
                        window.location.href = nextLink.href;
                    }, 1000);
                }
            }
        };
        
        document.addEventListener('ended', handleEnded, true);
        
        // Method 2: Next button click observer
        const observer = observerManager.create('autoNextObserver', () => {
            if (!settings.autoNext) return;
            
            const nextBtn = document.querySelector("div[title*='следующему эпизоду'], button[title*='Next']");
            if (nextBtn && nextBtn.offsetParent !== null && !nextBtn.dataset.alisaClicked) {
                nextBtn.dataset.alisaClicked = 'true';
                nextBtn.click();
                alisaLog('[NEXT]', 'Next episode button clicked automatically');
            }
        });
        
        observerManager.observe('autoNextObserver');
        
        return { 
            disconnect: () => {
                document.removeEventListener('ended', handleEnded, true);
                observerManager.disconnect('autoNextObserver');
            }
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // EPISODE PREVIEW MODULE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    function initPreview() {
        if (!settings.previewEnabled) {
            alisaLog('[INIT]', 'Preview is disabled');
            return { disconnect: () => {} };
        }
        
        alisaLog('[INIT]', 'Initializing Episode Preview');
        
        const previewBox = document.createElement('div');
        previewBox.className = 'alisa-prevbox';
        previewBox.innerHTML = `<img src="" alt="Preview" /><div>Loading...</div>`;
        document.body.appendChild(previewBox);
        
        const cache = new Map(); // In-memory LRU cache
        
        const handleMouseOver = async (e) => {
            const link = e.target.closest('a[href*="/episode-"]');
            if (!link) return;
            
            const href = link.href;
            const rect = link.getBoundingClientRect();
            
            try {
                if (cache.has(href)) {
                    const { img, title } = cache.get(href);
                    previewBox.querySelector('img').src = img;
                    previewBox.querySelector('div').textContent = title;
                } else {
                    previewBox.querySelector('div').textContent = 'Загрузка...';
                    
                    const response = await fetch(href);
                    const html = await response.text();
                    
                    // Try to extract preview image and title
                    const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
                    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
                    
                    const img = imgMatch ? imgMatch[1] : '';
                    const title = titleMatch ? titleMatch[1].trim() : 'No preview';
                    
                    if (img) {
                        cache.set(href, { img, title });
                        previewBox.querySelector('img').src = img;
                        previewBox.querySelector('div').textContent = title;
                    }
                }
                
                // Position preview box
                previewBox.style.display = 'block';
                previewBox.style.top = `${window.scrollY + rect.bottom + 10}px`;
                previewBox.style.left = `${window.scrollX + rect.left}px`;
            } catch (e) {
                alisaLog('[ERROR]', 'Preview fetch failed', { error: e.message });
                previewBox.style.display = 'none';
            }
        };
        
        const handleMouseOut = (e) => {
            if (e.target.closest('a[href*="/episode-"]')) {
                previewBox.style.display = 'none';
            }
        };
        
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);
        
        alisaLog('[INIT]', 'Preview observer attached');
        
        return {
            disconnect: () => {
                document.removeEventListener('mouseover', handleMouseOver);
                document.removeEventListener('mouseout', handleMouseOut);
                previewBox.remove();
                cache.clear();
            }
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // DOWNLOAD BUTTON MODULE (Placeholder)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    function initDownload() {
        if (!settings.downloadButton) {
            alisaLog('[INIT]', 'Download button is disabled');
            return { disconnect: () => {} };
        }
        
        alisaLog('[INIT]', 'Initializing Download Button');
        
        // Watch for video element and add download button
        const observer = observerManager.create('downloadObserver', () => {
            if (document.querySelector('.alisa-download-btn')) return;
            
            const video = document.querySelector('#my-player_html5_api');
            if (video && video.parentElement) {
                const btn = document.createElement('button');
                btn.className = 'alisa-btn alisa-download-btn';
                btn.textContent = '⬇️ Скачать';
                btn.style.marginTop = '10px';
                btn.addEventListener('click', () => {
                    const src = video.querySelector('source')?.src;
                    if (src) {
                        const link = document.createElement('a');
                        link.href = src;
                        link.download = `video_${Date.now()}.mp4`;
                        link.click();
                        alisaLog('[DOWNLOAD]', 'Download started');
                    } else {
                        showAlisaNotify('⚠️ Не удалось найти ссылку на видео');
                    }
                });
                
                video.parentElement.insertBefore(btn, video.nextElementSibling);
                alisaLog('[INIT]', 'Download button added');
            }
        });
        
        observerManager.observe('downloadObserver');
        
        return { disconnect: () => observerManager.disconnect('downloadObserver') };
    }
    // ═══════════════════════════════════════════════════════════════════════════════
    // EXTERNAL SOURCES INJECTION MODULE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    function initExternalSources() {
        if (!settings.externalInject) {
            alisaLog('[INIT]', 'External source injection is disabled');
            return { disconnect: () => {} };
        }
        
        alisaLog('[INIT]', 'Initializing External Source Injection');
        
        const processedVideos = new Set();
        
        const observer = observerManager.create('externalSourceObserver', () => {
            const video = document.querySelector('#my-player_html5_api, video[id*="player"]');
            if (!video || processedVideos.has(video)) return;
            
            processedVideos.add(video);
            handleVideoFound(video);
        });
        
        observerManager.observe('externalSourceObserver');
        
        return { disconnect: () => observerManager.disconnect('externalSourceObserver') };
    }
    
    async function handleVideoFound(videoElement) {
        debugLog('🎬 Video element found, starting source injection process', {
            elementId: videoElement.id,
            elementClass: videoElement.className,
            parentElement: videoElement.parentElement?.className
        });
        
        showAlisaNotify('🔍 Алиса ищет лучшие ссылочки для тебя... ♡');
        
        const title = await fetchOriginalTitle();
        if (!title) {
            alisaLog('[VIDEO]', 'Could not determine title for source injection');
            debugLog('Failed to determine video title');
            showAlisaNotify('⚠️ Не удалось определить название');
            return;
        }
        
        debugLog('📺 Video title extracted', { title: title });
        
        const { episode, season } = getEpisodeInfo();
        const storageKey = `alisa_src_${sanitizeTitle(title)}`;
        
        debugLog('Episode info extracted', { episode, season, storageKey });
        
        fetchExternalSources(title, async (results, usedTitle, usedProvider) => {
            if (!results || !results.length) {
                alisaLog('[VIDEO]', 'No external sources found');
                debugLog('No external sources found for this title', { originalTitle: title });
                showAlisaNotify('ℹ️ Источники не найдены — смотрите информацию на странице');
                renderNoSourcesBlock(title, episode, storageKey);
                return;
            }
            
            // Log detailed anime list with counts
            const animeCountLog = results.map((r, i) => `${i + 1}. ${r.title || r.id}`).join(', ');
            alisaLog('[VIDEO]', `📺 Found ${results.length} anime source(s): ${animeCountLog}`);
            debugLog(`✅ SUCCESS: Loaded ${results.length} anime source(s)`, {
                foundCount: results.length,
                animeList: results.map(r => ({
                    title: r.title,
                    provider: r.provider,
                    quality: r.quality,
                    type: r.type
                })),
                usedTitle: usedTitle || title,
                usedProvider: usedProvider || 'unknown'
            });
            
            const savedId = localStorage.getItem(storageKey);
            const selectedSource = savedId 
                ? results.find(r => r.id === savedId) 
                : results[0];
            
            debugLog('Source selected', {
                selectedSourceIndex: results.indexOf(selectedSource) + 1,
                savedId: savedId,
                usesSaved: !!savedId,
                selectedSourceId: selectedSource?.id,
                selectedSourceTitle: selectedSource?.title,
                totalResults: results.length,
                usedTitle: usedTitle || title,
                usedProvider: usedProvider || selectedSource?.provider
            });
            
            if (!selectedSource) {
                alisaLog('[ERROR]', 'Selected source not found in results');
                debugLog('Selected source not found in results array');
                return;
            }
            
            // Remove old jut.su player and replace with new one
            try {
                debugLog('🗑️  Removing old Jut.su player');
                
                const oldVideo = videoElement;
                const parentContainer = videoElement.parentElement;
                
                // Clear existing sources from old player
                const existingSources = oldVideo.querySelectorAll('source');
                existingSources.forEach(src => src.remove());
                
                // Create new video wrapper if needed
                let playerContainer = parentContainer;
                if (parentContainer.tagName === 'DIV' && parentContainer.children.length > 1) {
                    // If container has other elements, create a fresh wrapper
                    playerContainer = document.createElement('div');
                    playerContainer.style.cssText = 'width: 100%; position: relative; background: #000;';
                    parentContainer.insertBefore(playerContainer, oldVideo.nextSibling);
                    if (oldVideo.parentElement === parentContainer) {
                        parentContainer.removeChild(oldVideo);
                    }
                    playerContainer.appendChild(oldVideo);
                }
                
                debugLog('✅ Old player removed, preparing new source injection');
            } catch (removeError) {
                if (window.debugMode) debugLog('⚠️  Error removing old player:', { error: removeError.message });
                // Continue anyway
            }
            
            // Inject source and render buttons
            const sourceType = detectSourceType(selectedSource);
            debugLog('🎯 Source type detected and injection starting', {
                sourceType: sourceType,
                selectedSourceLink: selectedSource.link?.substring(0, 100),
                selectedSourceQuality: selectedSource.quality
            });
            
            const urlMap = selectedSource.urls || { default: selectedSource.link };
            const iframeUrl = selectedSource.link || urlMap.default || Object.values(urlMap)[0];
            const success = injectIframeSource(videoElement.parentElement, iframeUrl, title);
            
            debugLog('💾 Injection attempt result', { success: success, sourceType: sourceType });
            
            if (success) {
                alisaLog('[VIDEO]', `✅ Successfully injected: ${results.length} anime source(s)`);
                alisaLog('[VIDEO]', `Selected: «${selectedSource.title}» via ${selectedSource.provider}`);
                showAlisaNotify('✅ Видео готово! Приятного просмотра... ♡');
                renderSourceButtons(results, title, episode, storageKey);
                debugLog('🎉 SUCCESS: Source injection complete', {
                    selectedTitle: selectedSource.title,
                    selectedProvider: selectedSource.provider,
                    quality: selectedSource.quality,
                    type: sourceType
                });
            } else {
                alisaLog('[ERROR]', 'Failed to inject source');
                debugLog('Source injection failed');
                showAlisaNotify('❌ Ошибка при подстановке источника');
            }
        });
    }
 
    // ═══════════════════════════════════════════════════════════════════════════════
    // SETTINGS PANEL UI BUILDER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    function buildSettingsPanel() {
        // Create toggle button
        const toggle = document.createElement('button');
        toggle.className = 'alisa-panel-toggle';
        toggle.innerHTML = '⚙️';
        toggle.title = 'Открыть панель настроек';
        toggle.addEventListener('click', toggleSettingsPanel);
        document.body.appendChild(toggle);
        
        // Create settings panel
        const panel = document.createElement('div');
        panel.className = 'alisa-settings-panel';
        
        // Header
        const header = document.createElement('div');
        header.className = 'alisa-panel-header';
        const title = document.createElement('span');
        title.textContent = '🎬 Jut.su Auto+';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'alisa-panel-close';
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', toggleSettingsPanel);
        header.appendChild(title);
        header.appendChild(closeBtn);
        panel.appendChild(header);
        
        // Settings items
        const settingItems = [
            { key: 'autoSkip', label: '⏭️ Автоскип заставок' },
            { key: 'autoNext', label: '▶️ Автопереход на след. эпизод' },
            { key: 'previewEnabled', label: '🖼️ Превью эпизодов' },
            { key: 'downloadButton', label: '⬇️ Кнопка скачивания' },
            { key: 'externalInject', label: '🌐 Внешние источники (в разработке)' },
            { key: 'debugMode', label: '🔧 Debug Mode' }
        ];
        
        settingItems.forEach(({ key, label }) => {
            const item = document.createElement('div');
            item.className = 'alisa-setting-item';
            
            const labelEl = document.createElement('div');
            labelEl.className = 'alisa-setting-label';
            labelEl.textContent = label;
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = `alisa-toggle ${settings[key] ? 'active' : ''}`;
            toggleBtn.dataset.setting = key;
            
            // Обработчик на кнопку
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateSetting(key, !settings[key]);
            });
            
            // Обработчик на весь item для удобства
            item.addEventListener('click', () => {
                updateSetting(key, !settings[key]);
            });
            
            item.appendChild(labelEl);
            item.appendChild(toggleBtn);
            panel.appendChild(item);
        });

        // Provider selector (single tested provider)
        const providerItem = document.createElement('div');
        providerItem.className = 'alisa-setting-item';
        providerItem.style.flexDirection = 'column';
        providerItem.style.alignItems = 'stretch';

        const providerLabel = document.createElement('label');
        providerLabel.className = 'alisa-setting-label';
        providerLabel.textContent = '🔌 Провайдер источников';

        const providerSelect = document.createElement('select');
        providerSelect.className = 'alisa-select';
        providerSelect.dataset.providerSelect = 'true';

        const option = document.createElement('option');
        option.value = 'consumet';
        option.textContent = 'Consumet';
        providerSelect.appendChild(option);

        providerSelect.value = 'consumet';
        providerSelect.addEventListener('change', (e) => {
            updateSetting('providerPrimary', e.target.value);
        });

        providerItem.appendChild(providerLabel);
        providerItem.appendChild(providerSelect);
        panel.appendChild(providerItem);
        
        // Divider
        const divider = document.createElement('div');
        divider.style.cssText = 'border-top: 1px solid #444; margin: 12px 0;';
        panel.appendChild(divider);
        
        // Source selection button
        const sourceBtn = document.createElement('button');
        sourceBtn.className = 'alisa-btn';
        sourceBtn.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 8px;';
        sourceBtn.textContent = '🎨 Выбрать источник';
        sourceBtn.addEventListener('click', () => {
            const title = document.querySelector('h1')?.textContent || document.title;
            fetchExternalSources(title, (results, usedTitle) => {
                if (results) {
                    renderSourceModal(results, usedTitle || title, null);
                    toggleSettingsPanel();
                }
            });
        });
        panel.appendChild(sourceBtn);
        
        // Info button
        const infoBtn = document.createElement('button');
        infoBtn.className = 'alisa-btn secondary';
        infoBtn.style.cssText = 'width: 100%; padding: 10px;';
        infoBtn.textContent = 'ℹ️ О скрипте (консоль)';
        infoBtn.addEventListener('click', () => {
            console.log('%cJut.su Auto+ (Ultimate Edition)', 'background: #4caf50; color: #fff; padding: 8px; border-radius: 3px; font-weight: bold; font-size: 14px;');
            console.log('Версия: 3.8.2');
            console.log('Авторы: Rodion, Diorhc, VakiKrin, nab, Alisa');
            console.log('Лицензия: MIT');
            console.log('════════════════════════════════════════');
            console.log('%cСТАТУС И ДИАГНОСТИКА', 'background: #2196F3; color: #fff; padding: 4px; font-weight: bold;');
            console.log('Логи доступны в: window.alisaLogs');
            console.log('Debug Mode:', window.debugMode ? '🟢 ENABLED' : '⚫ DISABLED');
            console.log('Всего логов:', window.alisaLogs.length);
            console.log('Активных модулей:', window.alisaModules?.length || 0);
            console.log('User Agent:', navigator.userAgent.substring(0, 100));
            console.log('Current URL:', window.location.href);
            console.log('%cАКТИВНЫЕ НАСТРОЙКИ', 'background: #FF9800; color: #fff; padding: 4px; font-weight: bold;');
            console.table({
                'Auto Skip': settings.autoSkip,
                'Auto Next': settings.autoNext,
                'Preview': settings.previewEnabled,
                'Download': settings.downloadButton,
                'External Inject': settings.externalInject,
                'Debug Mode': settings.debugMode,
                'Provider Primary': 'consumet',
                'Provider Order': 'consumet'
            });
            console.log('%cПОЛНЫЙ ЛОГ', 'background: #FF5722; color: #fff; padding: 4px; font-weight: bold;');
            console.table(window.alisaLogs);
            console.log('%cDEBUG: EXPORTABLE JSON', 'background: #9C27B0; color: #fff; padding: 4px; font-weight: bold;');
            console.log(JSON.stringify({
                metadata: {
                    version: '3.8.2',
                    debugMode: window.debugMode,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent
                },
                settings: settings,
                logs: window.alisaLogs,
                stats: {
                    totalLogs: window.alisaLogs.length,
                    errorLogs: window.alisaLogs.filter(l => l.category.includes('ERROR')).length,
                    activeModules: window.alisaModules?.length
                }
            }, null, 2));
            alisaLog('[UI]', 'Info button clicked - full debug report displayed');
        });
        panel.appendChild(infoBtn);
        
        document.body.appendChild(panel);
        alisaLog('[UI]', 'Settings panel built and attached');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // MAIN INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    window.alisaModules = [];
    
    function initializeAllFeatures() {
        const initStartTime = performance.now();
        alisaLog('[INIT]', 'Starting main initialization sequence');
        debugLog('Script initialization started', {
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100),
            debugMode: window.debugMode,
            timestamp: new Date().toISOString()
        });
        
        // Inject styles first
        injectGlobalStyles();
        debugLog('Global styles injected successfully');
        alisaLog('[INIT]', 'Styles injected');
        
        // Register menu commands
        registerMenu();
        debugLog('Menu commands registered');
        alisaLog('[INIT]', 'Menu registered');
        
        // Build settings panel
        buildSettingsPanel();
        debugLog('Settings panel built and attached');
        
        // Initialize feature modules
        debugLog('Initializing feature modules...');
        window.alisaModules.push(initAutoSkip());
        window.alisaModules.push(initAutoNext());
        window.alisaModules.push(initPreview());
        window.alisaModules.push(initDownload());
        window.alisaModules.push(initExternalSources());
        
        const initDuration = Math.round(performance.now() - initStartTime);
        debugLog(`All ${window.alisaModules.length} feature modules initialized`, {
            modulesCount: window.alisaModules.length,
            totalTime: initDuration + 'ms'
        });
        
        alisaLog('[INIT]', `All ${window.alisaModules.length} feature modules initialized`);
    }
    
    // Run at document-start (before page content is loaded)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAllFeatures);
    } else {
        // If we somehow miss DomContentLoaded, run on load
        initializeAllFeatures();
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        alisaLog('[CLEANUP]', 'Unloading, disconnecting all modules');
        window.alisaModules.forEach((module) => {
            if (module && typeof module.disconnect === 'function') {
                module.disconnect();
            }
        });
    });
 
})();