// ============================================================
// ФАЙЛ: src/storage.js (АВТОМАТИЧЕСКИЙ НА ОСНОВЕ КОНФИГА)
// ============================================================

// Класс для работы с настройками через postMessage
class SettingsStorage {
    /**
     * Получить значения по умолчанию из конфига
     * @returns {Object}
     */
    static getDefaultSettings() {
        // Если конфиг загружен, используем его
        if (window.SettingsConfigHelper) {
            return SettingsConfigHelper.getDefaultSettings();
        }
        
        // Fallback на случай, если конфиг не загружен
        console.warn('[SettingsStorage] ⚠️ Конфиг не загружен, используется fallback');
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

    /**
     * Получить все настройки
     * @returns {Promise<Object>}
     */
    static async getSettings() {
        return new Promise((resolve) => {
            const requestId = 'storage_get_' + Date.now() + '_' + Math.random();
            const defaults = this.getDefaultSettings();
            
            const listener = (event) => {
                if (event.data && 
                    event.data.type === 'STORAGE_RESPONSE' && 
                    event.data.requestId === requestId) {
                    window.removeEventListener('message', listener);
                    resolve(event.data.settings || defaults);
                }
            };
            
            window.addEventListener('message', listener);
            
            window.postMessage({
                type: 'STORAGE_GET',
                requestId: requestId
            }, '*');
            
            // Таймаут на случай, если bridge не ответит
            setTimeout(() => {
                window.removeEventListener('message', listener);
                resolve(defaults);
            }, 1000);
        });
    }

    /**
     * Получить одну настройку по ключу
     * @param {string} key - ключ настройки
     * @returns {Promise<any>}
     */
    static async getSetting(key) {
        const settings = await this.getSettings();
        return settings[key];
    }

    /**
     * Сохранить настройки (полные или частичные)
     * @param {Object} settings - объект настроек
     * @returns {Promise<boolean>}
     */
    static async saveSettings(settings) {
        return new Promise((resolve) => {
            const requestId = 'storage_set_' + Date.now() + '_' + Math.random();
            
            const listener = (event) => {
                if (event.data && 
                    event.data.type === 'STORAGE_SET_RESPONSE' && 
                    event.data.requestId === requestId) {
                    window.removeEventListener('message', listener);
                    resolve(event.data.success);
                }
            };
            
            window.addEventListener('message', listener);
            
            window.postMessage({
                type: 'STORAGE_SET',
                requestId: requestId,
                settings: settings
            }, '*');
            
            setTimeout(() => {
                window.removeEventListener('message', listener);
                resolve(false);
            }, 1000);
        });
    }

    /**
     * Сохранить одну настройку
     * @param {string} key - ключ настройки
     * @param {any} value - значение
     * @returns {Promise<boolean>}
     */
    static async saveSetting(key, value) {
        return this.saveSettings({ [key]: value });
    }

    /**
     * Сбросить настройки к значениям по умолчанию
     * @returns {Promise<boolean>}
     */
    static async resetSettings() {
        const defaults = this.getDefaultSettings();
        return this.saveSettings(defaults);
    }

    /**
     * Подписаться на изменения настроек
     * @param {Function} callback - функция обратного вызова
     */
    static onSettingsChanged(callback) {
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'STORAGE_CHANGED') {
                callback(event.data.changes);
            }
        });
    }

    /**
     * Получить список всех ключей настроек
     * @returns {Array<string>}
     */
    static getAllKeys() {
        if (window.SettingsConfigHelper) {
            return SettingsConfigHelper.getAllKeys();
        }
        
        // Fallback
        return Object.keys(this.getDefaultSettings());
    }

    /**
     * Проверить, существует ли настройка
     * @param {string} key - ключ настройки
     * @returns {boolean}
     */
    static hasSetting(key) {
        const defaults = this.getDefaultSettings();
        return key in defaults;
    }
}

// Экспорт в глобальную область
window.SettingsStorage = SettingsStorage;

// Обратная совместимость
window.STORAGE_KEYS = (function() {
    const keys = {};
    if (window.SettingsConfigHelper) {
        SettingsConfigHelper.getAllSettings().forEach(setting => {
            // Преобразуем camelCase в UPPER_SNAKE_CASE
            const upperKey = setting.key.replace(/([A-Z])/g, '_$1').toUpperCase();
            keys[upperKey] = setting.key;
        });
    }
    return keys;
})();

window.DEFAULT_SETTINGS = SettingsStorage.getDefaultSettings();