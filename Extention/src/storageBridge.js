// ============================================================
// ФАЙЛ: src/storageBridge.js (С СЕРВЕРОМ)
// ============================================================

// Bridge между MAIN world и isolated world для доступа к chrome.storage

(function() {
    const DEFAULT_SETTINGS = {
        showAchievementsButton: true,
        restoreNavigation: true,
        showChat: true,
        enableProfileEditor: true,
        enableSpeedSettingInVideoPlayer: true,
        enableServerConnection: true // НОВОЕ
    };

    // Слушаем сообщения от MAIN world
    window.addEventListener('message', async (event) => {
        // Игнорируем сообщения не от нашего домена
        if (event.source !== window) return;

        const message = event.data;

        // Запрос на получение настроек
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
                window.postMessage({
                    type: 'STORAGE_RESPONSE',
                    requestId: message.requestId,
                    settings: DEFAULT_SETTINGS
                }, '*');
            }
        }

        // Запрос на сохранение настроек
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
                window.postMessage({
                    type: 'STORAGE_SET_RESPONSE',
                    requestId: message.requestId,
                    success: false
                }, '*');
            }
        }
    });

    // Слушаем изменения в chrome.storage и пересылаем в MAIN world
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
            const updatedSettings = {};
            for (let key in changes) {
                updatedSettings[key] = changes[key].newValue;
            }
            
            window.postMessage({
                type: 'STORAGE_CHANGED',
                changes: updatedSettings
            }, '*');
        }
    });
})();