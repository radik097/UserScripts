// ============================================================
// ФАЙЛ: background.js (SERVICE WORKER) - УДАЛЁННЫЙ СЕРВЕР
// Обработка запросов от content script и отправка на сервер
// ============================================================

class UserAgentManager {
    constructor() {
        this.currentUserAgent = null;
        this.isActive = false;
        this.RULE_ID = 1;
        this.activeVideoUrls = new Set();
    }

    /**
     * Установить кастомный User-Agent для jut.su и видео доменов
     */
    async setUserAgent(userAgent, videoUrls = []) {
        if (!userAgent) {
            //console.log('[UserAgentManager] User-Agent не предоставлен');
            return;
        }

        this.currentUserAgent = userAgent;
        this.isActive = true;

        // Сохраняем URL видео
        videoUrls.forEach(url => this.activeVideoUrls.add(url));

        // Извлекаем домены из URL видео
        const videoDomains = this.extractDomains(videoUrls);
        
        //console.log('[UserAgentManager] 🔧 Установка User-Agent:', userAgent);
        //console.log('[UserAgentManager] 🎯 Для доменов:', videoDomains);
        //console.log('[UserAgentManager] 📹 Video URLs:', videoUrls);

        // Создаём правила для КАЖДОГО домена отдельно
        const rules = [];
        
        if (videoDomains.length > 0) {
            videoDomains.forEach((domain, index) => {
                rules.push({
                    id: this.RULE_ID + index,
                    priority: 1,
                    action: {
                        type: 'modifyHeaders',
                        requestHeaders: [
                            {
                                header: 'user-agent',
                                operation: 'set',
                                value: userAgent
                            },
                            {
                                header: 'referer',
                                operation: 'set',
                                value: 'https://jut.su/'
                            }
                        ]
                    },
                    condition: {
                        urlFilter: `*://${domain}/*`,
                        resourceTypes: ['xmlhttprequest', 'media', 'other']
                    }
                });
            });
        }

        // Добавляем правило для jut.su
        rules.push({
            id: this.RULE_ID + 100,
            priority: 1,
            action: {
                type: 'modifyHeaders',
                requestHeaders: [
                    {
                        header: 'user-agent',
                        operation: 'set',
                        value: userAgent
                    }
                ]
            },
            condition: {
                urlFilter: '*://jut.su/*',
                resourceTypes: ['xmlhttprequest', 'media', 'other']
            }
        });

        try {
            // Получаем все существующие правила
            const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
            const ruleIdsToRemove = existingRules.map(rule => rule.id);
            
            //console.log('[UserAgentManager] 🗑️ Удаляем старые правила:', ruleIdsToRemove);
            
            // Удаляем ВСЕ старые правила и добавляем новые
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove,
                addRules: rules
            });

            //console.log('[UserAgentManager] ✅ User-Agent успешно установлен');
            //console.log('[UserAgentManager] 📋 Создано правил:', rules.length);
            
            // Проверяем, что правила действительно созданы
            const newRules = await chrome.declarativeNetRequest.getDynamicRules();
            //console.log('[UserAgentManager] 🔍 Активные правила:', newRules);
            
        } catch (error) {
            //console.error('[UserAgentManager] ❌ Ошибка установки User-Agent:', error);
            throw error;
        }
    }

    /**
     * Сбросить User-Agent (восстановить оригинальный)
     */
    async resetUserAgent() {
        if (!this.isActive) {
            //console.log('[UserAgentManager] User-Agent уже сброшен');
            return;
        }

        //console.log('[UserAgentManager] 🔄 Сброс User-Agent');

        try {
            // Получаем все правила
            const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
            const ruleIdsToRemove = existingRules.map(rule => rule.id);
            
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove
            });

            this.currentUserAgent = null;
            this.isActive = false;
            this.activeVideoUrls.clear();

            //console.log('[UserAgentManager] ✅ User-Agent сброшен');
        } catch (error) {
            //console.error('[UserAgentManager] ❌ Ошибка сброса User-Agent:', error);
        }
    }

    /**
     * Извлечь домены из URL
     */
    extractDomains(urls) {
        const domains = new Set();
        
        urls.forEach(url => {
            try {
                const urlObj = new URL(url);
                // Извлекаем домен без протокола
                domains.add(urlObj.hostname);
            } catch (error) {
                //console.warn('[UserAgentManager] Невалидный URL:', url);
            }
        });

        return Array.from(domains);
    }

    /**
     * Проверить, активен ли кастомный User-Agent
     */
    isUserAgentActive() {
        return this.isActive;
    }

    /**
     * Получить текущий User-Agent
     */
    getCurrentUserAgent() {
        return this.currentUserAgent;
    }
}

// Глобальный экземпляр
const userAgentManager = new UserAgentManager();

// ============================================================
// КОНФИГУРАЦИЯ СЕРВЕРОВ
// ============================================================

// 🔥 ЗАМЕНИТЕ НА ВАШ ДОМЕН!
const SERVER_CONFIG = {
    // Ваш основной домен (HTTPS обязательно!)
    primary: 'https://jutsu.fun',
    
    // Запасной домен (если есть)
    fallback: 'https://backup-domain.com'
};

// Текущий активный сервер
let currentServer = SERVER_CONFIG.primary;

// ============================================================
// ОБРАБОТЧИК СООБЩЕНИЙ
// ============================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Проверяем валидность контекста
    if (!chrome.runtime?.id) {
        sendResponse({ 
            success: false, 
            error: 'Extension context invalidated' 
        });
        return false;
    }

    //console.log('[Background] 📨 Получено сообщение:', request.action);
    
    handleMessage(request, sender, sendResponse);
    return true; // Keep channel open for async
});

async function handleMessage(request, sender, sendResponse) {
    try {
        switch (request.action) {
            case 'PING':
                sendResponse({ 
                    success: true, 
                    data: {
                        pong: true,
                        timestamp: Date.now(),
                        server: currentServer
                    }
                });
                break;

            case 'GET_VIDEO_SOURCES':
                await handleGetVideoSources(request.data, sendResponse);
                break;

            case 'SET_USER_AGENT':
                //console.log('[Background] 🔧 Установка User-Agent...');
                await userAgentManager.setUserAgent(
                    request.data.userAgent,
                    request.data.videoUrls || []
                );
                sendResponse({ success: true });
                break;

            case 'RESET_USER_AGENT':
                //console.log('[Background] 🔄 Сброс User-Agent...');
                await userAgentManager.resetUserAgent();
                sendResponse({ success: true });
                break;

            case 'GET_COOKIES':
                const cookies = await handleGetCookies(request.data);
                sendResponse({ 
                    success: true, 
                    data: cookies 
                });
                break;

            case 'SEND_VIDEO_DATA':
                const result = await handleSendVideoData(request.data);
                sendResponse({ 
                    success: true, 
                    data: result 
                });
                break;

            default:
                sendResponse({ 
                    success: false, 
                    error: 'Unknown action' 
                });
        }
    } catch (error) {
        //console.error('[Background] ❌ Ошибка:', error);
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
}

/**
 * Получить источники видео с сервера
 */
async function handleGetVideoSources(metadata, sendResponse) {
    console.log('[Background] 🎬 Запрос источников для:', metadata);
    
    const endpoint = `${currentServer}/api/getepisode`;
    
    try {
        const response = await fetchWithFallback(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[Background] 📥 Получены источники:', result);
        console.log('[Background] 🔍 result.sources:', result.sources);
        console.log('[Background] 🔍 result.userAgent:', result.userAgent);
        
        sendResponse({ 
            success: true, 
            data: result
        });
    } catch (error) {
        console.error('[Background] ❌ Ошибка получения источников:', error);
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
}

/**
 * Получить куки через Chrome API
 */
async function handleGetCookies(data) {
    const { url, names } = data;
    const cookies = {};
    
    //console.log('[Background] 🍪 Запрос куки для:', url);
    //console.log('[Background] 🍪 Имена:', names);
    
    for (const name of names) {
        try {
            const cookie = await chrome.cookies.get({
                url: url,
                name: name
            });
            
            if (cookie) {
                cookies[name] = cookie.value;
                //console.log('[Background] ✅ Получен cookie:', name);
            } else {
                //console.log('[Background] ⚠️ Cookie не найден:', name);
            }
        } catch (error) {
            //console.error(`[Background] ❌ Ошибка получения cookie ${name}:`, error);
        }
    }
    
    return cookies;
}

/**
 * Отправить данные о видео на сервер
 */
async function handleSendVideoData(videoData) {
    //console.log('[Background] 📤 Отправка данных на сервер...');
    
    // Кодируем данные (простая обфускация)
    const encodedData = encodeData(videoData);
    
    // Пробуем отправить на текущий сервер
    const endpoint = `${currentServer}/api/sendepisode`;
    
    try {
        const response = await fetchWithFallback(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(encodedData),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        //console.log('[Background] 📥 Ответ сервера:', result);
        
        return result;
    } catch (error) {
        //console.error('[Background] ❌ Ошибка отправки на сервер:', error);
        throw error;
    }
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Fetch с автоматическим переключением между primary и fallback
 */
async function fetchWithFallback(url, options) {
    try {
        //console.log('[Background] 🌐 Попытка подключения к:', url);
        const response = await fetch(url, options);
        return response;
    } catch (error) {
        // Если текущий сервер недоступен, пробуем альтернативный
        if (currentServer === SERVER_CONFIG.primary && SERVER_CONFIG.fallback) {
            //console.log('[Background] ⚠️ Primary сервер недоступен, пробуем fallback...');
            currentServer = SERVER_CONFIG.fallback;
            const fallbackUrl = url.replace(SERVER_CONFIG.primary, SERVER_CONFIG.fallback);
            return fetch(fallbackUrl, options);
        } else if (currentServer === SERVER_CONFIG.fallback && SERVER_CONFIG.primary) {
            //console.log('[Background] ⚠️ Fallback недоступен, возвращаемся к primary...');
            currentServer = SERVER_CONFIG.primary;
            const primaryUrl = url.replace(SERVER_CONFIG.fallback, SERVER_CONFIG.primary);
            return fetch(primaryUrl, options);
        } else {
            throw error;
        }
    }
}

/**
 * Кодирование данных (простая обфускация)
 */
function encodeData(data) {
    const jsonStr = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const reversed = base64.split('').reverse().join('');
    
    const prefix = Math.random().toString(36).substring(2, 8);
    const suffix = Math.random().toString(36).substring(2, 8);
    
    return {
        d: reversed,
        p: prefix,
        s: suffix
    };
}

// ============================================================
// АВТОМАТИЧЕСКИЙ СБРОС USER-AGENT ПОСЛЕ ЗАГРУЗКИ ВИДЕО
// ============================================================

// Отслеживаем завершённые запросы к видео
chrome.webRequest.onCompleted.addListener(
    (details) => {
        // Проверяем, был ли это запрос к видео с нашим User-Agent
        if (userAgentManager.isUserAgentActive()) {
            const isVideoRequest = Array.from(userAgentManager.activeVideoUrls).some(url => 
                details.url.includes(url) || url.includes(details.url)
            );
            
            if (isVideoRequest) {
                //console.log('[Background] ✅ Видео запрос завершён:', details.url);
                // Сбрасываем User-Agent через 2 секунды после загрузки
                setTimeout(async () => {
                    //console.log('[Background] 🔄 Автоматический сброс User-Agent');
                    await userAgentManager.resetUserAgent();
                }, 2000);
            }
        }
    },
    { urls: ["<all_urls>"] }
);

// ============================================================
// ОТСЛЕЖИВАНИЕ НАВИГАЦИИ ДЛЯ СБРОСА USER-AGENT
// ============================================================

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Сбрасываем User-Agent при переходе на другую страницу
    if (details.frameId === 0) { // Только для главного фрейма
        const url = new URL(details.url);
        
        // Сбрасываем при переходе на любую другую страницу
        if (userAgentManager.isUserAgentActive()) {
            //console.log('[Background] 🔄 Навигация обнаружена, сбрасываем User-Agent');
            await userAgentManager.resetUserAgent();
        }
    }
});

// Также сбрасываем при закрытии вкладки
chrome.tabs.onRemoved.addListener(async (tabId) => {
    if (userAgentManager.isUserAgentActive()) {
        //console.log('[Background] 🗑️ Вкладка закрыта, сбрасываем User-Agent');
        await userAgentManager.resetUserAgent();
    }
});

// ============================================================
// СОБЫТИЯ ЖИЗНЕННОГО ЦИКЛА
// ============================================================

chrome.runtime.onInstalled.addListener((details) => {
    //console.log('[Background] 🔧 Расширение установлено/обновлено');
    //console.log('[Background] 📋 Причина:', details.reason);
    
    if (details.reason === 'install') {
        //console.log('[Background] 🎉 Первая установка расширения!');
    } else if (details.reason === 'update') {
        const version = chrome.runtime.getManifest().version;
        //console.log('[Background] 🔄 Расширение обновлено до версии:', version);
    }
});

//console.log('[Background] 🚀 Service Worker запущен');
//console.log('[Background] ✅ Service Worker готов к работе');
//console.log('[Background] 🌐 Серверы:', SERVER_CONFIG);
//console.log('[Background] 🎯 Текущий сервер:', currentServer);