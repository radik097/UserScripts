// ============================================================
// ФАЙЛ: src/settingsConfig.js
// Централизованная конфигурация всех настроек расширения
// С АВТОМАТИЧЕСКИМИ ОБРАБОТЧИКАМИ onChange и onInit
// ============================================================

/**
 * Конфигурация настроек расширения
 * 
 * Структура объекта настройки:
 * - key: уникальный ключ настройки (используется в chrome.storage)
 * - title: название настройки
 * - description: описание настройки
 * - defaultValue: значение по умолчанию
 * - section: секция в popup (для группировки)
 * - order: порядок отображения в секции
 * - onChange: (опционально) функция-обработчик при изменении настройки
 * - onInit: (опционально) функция-обработчик при инициализации
 */
const SETTINGS_CONFIG = [
    // ========================================
    // СЕКЦИЯ: Уникальные функции
    // ========================================
    {
        key: 'showAchievementsButton',
        title: 'Отображение достижений',
        description: 'Показывать кнопку "🏆 Достижения" в которой будут отображаться доступные к получению достижения текущей серии',
        defaultValue: true,
        section: 'unique',
        order: 1,
        onChange: (newValue, domManager) => {
            const button = domManager.getElement('achievementsButton');
            const panel = domManager.getElement('panel');
            const overlay = domManager.getElement('overlay');

            if (newValue) {
                if (button) button.style.display = 'inline-block';
            } else {
                if (button) button.style.display = 'none';
                if (panel && overlay) {
                    panel.style.display = 'none';
                    overlay.style.display = 'none';
                }
            }
        }
    },
    {
        key: 'enableSpeedSettingInVideoPlayer',
        title: 'Настройка скорости',
        description: 'Среди кнопок управления видио плеером появляется кнопка для управление скорости с помощью ползунка (x0.1-x16)',
        defaultValue: true,
        section: 'unique',
        order: 2,
        onInit: (value) => {
            if (value && typeof initVideoSpeedSlider === 'function') {
                initVideoSpeedSlider();
            }
        },
        onChange: (newValue) => {
            if (newValue) {
                if (typeof initVideoSpeedSlider === 'function') {
                    initVideoSpeedSlider();
                }
            } else {
                if (typeof videojs !== 'undefined' && videojs.getPlayers) {
                    const players = Object.values(videojs.getPlayers());
                    if (players.length) {
                        const player = players[0];
                        const speedButton = player.controlBar.getChild('SpeedMenuButton');
                        if (speedButton) {
                            player.controlBar.removeChild(speedButton);
                        }
                    }
                }
            }
        }
    },
    {
        key: 'enableProfileEditor',
        title: 'Редактор профиля',
        description: 'Улучшенное редактирование аватара и фона (обрезка и вращение фотографии после выбора файла)',
        defaultValue: true,
        section: 'unique',
        order: 3,
        onInit: (value) => {
            if (value && typeof ProfileEditor !== 'undefined' && ProfileEditor.isProfilePage()) {
                ProfileEditor.initIfNeeded();
            }
        },
        onChange: (newValue) => {
            if (newValue && typeof ProfileEditor !== 'undefined' && ProfileEditor.isProfilePage()) {
                //console.log('[Main] Редактор профиля включён, перезагружаем страницу...');
                location.reload();
            }
        }
    },
    {
        key: 'enableServerConnection',
        title: 'Функции сервера',
        description: 'Если у вас подписка то вы становитесь донором и делитесь аниме с другими, если нет то вы можете смотреть аниме благодаря донорам, более подробно об этом в разделе расширения в навигации.',
        defaultValue: true,
        section: 'unique',
        order: 4,
        onInit: (value) => {
            if (value && typeof VideoTracker !== 'undefined') {
                const tracker = new VideoTracker();
                tracker.init();
            }
        },
        onChange: (newValue) => {
            //console.log('[Main] Настройка сервера изменена, перезагружаем страницу...');
            location.reload();
        }
    },
    {
        key: 'enableUserAnimePage',
        title: 'Расширенная страница аниме пользователя',
        description: 'Добавляет дополнительную информацию на страницу с Аниме пользователя с расширенной статистикой просмотров',
        defaultValue: true,
        section: 'unique',
        order: 5,
        onInit: (value) => {
            if (value && typeof UserAnimePage !== 'undefined') {
                UserAnimePage.init();
            }
        },
        onChange: (newValue) => {
            if (typeof UserAnimePage === 'undefined') return;
            
            if (newValue) {
                UserAnimePage.init();
            } else {
                UserAnimePage.remove();
            }
        }
    },

    // ========================================
    // СЕКЦИЯ: Старые удаленные функции
    // ========================================
    {
        key: 'showChat',
        title: 'Чат сообщества',
        description: 'Возвращает чат сообщества в боковую панель, недавно он был удален',
        defaultValue: true,
        section: 'old',
        order: 1,
        onInit: (value) => {
            if (value && typeof ChatWidget !== 'undefined') {
                ChatWidget.init();
            }
        },
        onChange: (newValue) => {
            if (typeof ChatWidget !== 'undefined') {
                ChatWidget.toggle(newValue);
            }
        }
    },
    {
        key: 'restoreNavigation',
        title: 'Восстановление навигации',
        description: 'Востанавливает навигаю сайта возвращая все удаленные кнопки навигации',
        defaultValue: true,
        section: 'old',
        order: 2,
        onInit: (value) => {
            if (value && typeof NavigationRestorer !== 'undefined') {
                NavigationRestorer.init();
            }
        },
        onChange: (newValue) => {
            if (newValue && typeof NavigationRestorer !== 'undefined') {
                NavigationRestorer.init();
            }
        }
    }
];

/**
 * Конфигурация секций для группировки настроек
 */
const SECTIONS_CONFIG = {
    unique: {
        title: '🎯 Уникальные функции',
        order: 1
    },
    old: {
        title: '👴 Старые удаленные функции',
        order: 2
    }
};

/**
 * Вспомогательный класс для работы с конфигурацией настроек
 */
class SettingsConfigHelper {
    /**
     * Получить все настройки
     * @returns {Array}
     */
    static getAllSettings() {
        return [...SETTINGS_CONFIG];
    }

    /**
     * Получить настройки по секции
     * @param {string} sectionKey - ключ секции
     * @returns {Array}
     */
    static getSettingsBySection(sectionKey) {
        return SETTINGS_CONFIG
            .filter(setting => setting.section === sectionKey)
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Получить настройку по ключу
     * @param {string} key - ключ настройки
     * @returns {Object|null}
     */
    static getSettingByKey(key) {
        return SETTINGS_CONFIG.find(setting => setting.key === key) || null;
    }

    /**
     * Получить объект значений по умолчанию
     * @returns {Object}
     */
    static getDefaultSettings() {
        const defaults = {};
        SETTINGS_CONFIG.forEach(setting => {
            defaults[setting.key] = setting.defaultValue;
        });
        // Добавляем тему (не входит в основную конфигурацию)
        defaults.darkTheme = false;
        return defaults;
    }

    /**
     * Получить все ключи настроек
     * @returns {Array<string>}
     */
    static getAllKeys() {
        return SETTINGS_CONFIG.map(setting => setting.key);
    }

    /**
     * Получить секции в порядке отображения
     * @returns {Array<{key: string, title: string}>}
     */
    static getSectionsOrdered() {
        return Object.entries(SECTIONS_CONFIG)
            .map(([key, config]) => ({
                key,
                title: config.title,
                order: config.order
            }))
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Валидация настроек (проверка на дубликаты ключей)
     * @returns {boolean}
     */
    static validateConfig() {
        const keys = SETTINGS_CONFIG.map(s => s.key);
        const uniqueKeys = new Set(keys);
        
        if (keys.length !== uniqueKeys.size) {
            console.error('[SettingsConfig] ❌ Обнаружены дубликаты ключей!');
            return false;
        }
        
        console.log('[SettingsConfig] ✅ Конфигурация валидна');
        return true;
    }

    /**
     * Выполнить все onInit обработчики
     * @param {Object} settings - текущие настройки
     * @param {Object} context - контекст (например, domManager)
     */
    static executeInitHandlers(settings, context = {}) {
        SETTINGS_CONFIG.forEach(config => {
            if (config.onInit && typeof config.onInit === 'function') {
                try {
                    const value = settings[config.key];
                    config.onInit(value, context);
                } catch (error) {
                    console.error(`[SettingsConfig] ❌ Ошибка в onInit для ${config.key}:`, error);
                }
            }
        });
    }

    /**
     * Выполнить обработчик onChange для конкретной настройки
     * @param {string} key - ключ настройки
     * @param {any} newValue - новое значение
     * @param {Object} context - контекст (например, domManager)
     */
    static executeChangeHandler(key, newValue, context = {}) {
        const config = this.getSettingByKey(key);
        
        if (!config) {
            console.warn(`[SettingsConfig] ⚠️ Настройка с ключом "${key}" не найдена`);
            return;
        }

        if (config.onChange && typeof config.onChange === 'function') {
            try {
                config.onChange(newValue, context);
            } catch (error) {
                console.error(`[SettingsConfig] ❌ Ошибка в onChange для ${key}:`, error);
            }
        }
    }

    /**
     * Выполнить обработчики onChange для множества изменений
     * @param {Object} changes - объект с изменениями {key: newValue}
     * @param {Object} context - контекст
     */
    static executeChangeHandlers(changes, context = {}) {
        Object.entries(changes).forEach(([key, newValue]) => {
            this.executeChangeHandler(key, newValue, context);
        });
    }
}

// Экспорт в глобальную область
window.SETTINGS_CONFIG = SETTINGS_CONFIG;
window.SECTIONS_CONFIG = SECTIONS_CONFIG;
window.SettingsConfigHelper = SettingsConfigHelper;

// Валидация при загрузке
SettingsConfigHelper.validateConfig();