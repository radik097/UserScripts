// ============================================================
// ФАЙЛ: src/bridge.js (ISOLATED WORLD) - АВТОМАТИЧЕСКИЙ
// Мост между страницей (MAIN world) и расширением
// ============================================================

(function() {
    console.log('[Bridge] 🌉 Инициализация моста расширения');

    /**
     * Получить настройки по умолчанию
     * Эти значения синхронизированы с settingsConfig.js
     */
    function getDefaultSettings() {
        return {
            showAchievementsButton: true,
            restoreNavigation: true,
            showChat: true,
            enableProfileEditor: true,
            enableSpeedSettingInVideoPlayer: true,
            enableServerConnection: true,
            enableUserAnimePage: true,
            darkTheme: false
        };
    }

    const DEFAULT_SETTINGS = getDefaultSettings();

    // ============================================================
    // ЧАСТЬ 1: Слушаем сообщения ОТ СТРАНИЦЫ (MAIN world)
    // ============================================================
    window.addEventListener('message', async (event) => {
        // Проверяем, что сообщение от нашего окна
        if (event.source !== window) return;

        const message = event.data;

        // ────────────────────────────────────────────────────────
        // Запрос на получение настроек из chrome.storage
        // ────────────────────────────────────────────────────────
        if (message.type === 'STORAGE_GET') {
            try {
                chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
                    window.postMessage({
                        type: 'STORAGE_RESPONSE',
                        requestId: message.requestId,
                        settings: settings
                    }, '*');
                });
            } catch (error) {
                console.error('[Bridge] ❌ Ошибка получения настроек:', error);
                window.postMessage({
                    type: 'STORAGE_RESPONSE',
                    requestId: message.requestId,
                    settings: DEFAULT_SETTINGS
                }, '*');
            }
        }

        // ────────────────────────────────────────────────────────
        // Запрос на сохранение настроек в chrome.storage
        // ────────────────────────────────────────────────────────
        if (message.type === 'STORAGE_SET') {
            try {
                chrome.storage.sync.set(message.settings, () => {
                    window.postMessage({
                        type: 'STORAGE_SET_RESPONSE',
                        requestId: message.requestId,
                        success: true
                    }, '*');
                });
            } catch (error) {
                console.error('[Bridge] ❌ Ошибка сохранения настроек:', error);
                window.postMessage({
                    type: 'STORAGE_SET_RESPONSE',
                    requestId: message.requestId,
                    success: false
                }, '*');
            }
        }

        // ────────────────────────────────────────────────────────
        // Отправка данных в Background Service Worker
        // Это универсальный метод для любых запросов к серверу
        // ────────────────────────────────────────────────────────
        if (message.type === 'BACKGROUND_REQUEST') {
            console.log('[Bridge] 📤 Получен запрос от страницы:', {
                action: message.action,
                requestId: message.requestId,
                data: message.data
            });
            
            try {
                let response;

                if (message.action === 'GET_COOKIES') {
                    console.log('[Bridge] 🍪 Запрос cookies через background...');
                    // специальная обработка cookies через chrome.cookies API в background
                    response = await chrome.runtime.sendMessage({
                        action: 'GET_COOKIES',
                        data: message.data
                    });
                    console.log('[Bridge] 🍪 Ответ от background:', response);
                } else {
                    // универсальная обработка всех остальных действий
                    response = await chrome.runtime.sendMessage({
                        action: message.action,
                        data: message.data
                    });
                }

                console.log('[Bridge] 📥 Отправка ответа на страницу:', {
                    requestId: message.requestId,
                    success: response?.success,
                    hasData: !!response?.data
                });

                window.postMessage({
                    type: 'BACKGROUND_RESPONSE',
                    requestId: message.requestId,
                    success: response?.success || false,
                    data: response?.data || null,
                    error: response?.error || null
                }, '*');
            } catch (error) {
                console.error('[Bridge] ❌ Ошибка при обработке запроса:', error);
                window.postMessage({
                    type: 'BACKGROUND_RESPONSE',
                    requestId: message.requestId,
                    success: false,
                    error: error.message
                }, '*');
            }
        }

    });

    // ============================================================
    // ЧАСТЬ 2: Слушаем изменения настроек и отправляем НА СТРАНИЦУ
    // ============================================================
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
            const updatedSettings = {};
            for (let key in changes) {
                updatedSettings[key] = changes[key].newValue;
            }
            
            console.log('[Bridge] 🔄 Настройки изменены:', updatedSettings);
            
            window.postMessage({
                type: 'STORAGE_CHANGED',
                changes: updatedSettings
            }, '*');
        }
    });

    console.log('[Bridge] ✅ Мост готов к работе');
})();