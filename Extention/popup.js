// ============================================================
// ФАЙЛ: popup.js (СО ВСТРОЕННОЙ КОНФИГУРАЦИЕЙ)
// ============================================================

// ============================================================
// ВСТРОЕННАЯ КОНФИГУРАЦИЯ НАСТРОЕК
// ============================================================
const SETTINGS_CONFIG = [
    // Уникальные функции
    {
        key: 'showAchievementsButton',
        title: 'Отображение достижений',
        description: 'Показывать кнопку "🏆 Достижения" в которой будут отображаться доступные к получению достижения текущей серии',
        defaultValue: true,
        section: 'unique',
        order: 1
    },
    {
        key: 'enableSpeedSettingInVideoPlayer',
        title: 'Настройка скорости',
        description: 'Среди кнопок управления видио плеером появляется кнопка для управление скорости с помощью ползунка (x0.1-x16)',
        defaultValue: true,
        section: 'unique',
        order: 2
    },
    {
        key: 'enableProfileEditor',
        title: 'Редактор профиля',
        description: 'Улучшенное редактирование аватара и фона (обрезка и вращение фотографии после выбора файла)',
        defaultValue: true,
        section: 'unique',
        order: 3
    },
    {
        key: 'enableServerConnection',
        title: 'Функции сервера',
        description: 'Если у вас подписка то вы становитесь донором и делитесь аниме с другими, если нет то вы можете смотреть аниме благодаря донорам, более подробно об этом в разделе расширения в навигации.',
        defaultValue: true,
        section: 'unique',
        order: 4
    },
    {
        key: 'enableUserAnimePage',
        title: 'Расширенная страница аниме',
        description: 'Добавляет дополнительную информацию на страницу с Аниме пользователя с расширенной статистикой просмотров',
        defaultValue: true,
        section: 'unique',
        order: 5
    },
    // Старые функции
    {
        key: 'showChat',
        title: 'Чат сообщества',
        description: 'Возвращает чат сообщества в боковую панель, недавно он был удален',
        defaultValue: true,
        section: 'old',
        order: 1
    },
    {
        key: 'restoreNavigation',
        title: 'Восстановление навигации',
        description: 'Востанавливает навигаю сайта возвращая все удаленные кнопки навигации',
        defaultValue: true,
        section: 'old',
        order: 2
    }
];

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

// ============================================================
// АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ UI
// ============================================================

function generatePopupHTML() {
    const settingsContainer = document.getElementById('settingsContainer');
    if (!settingsContainer) {
        console.error('[Popup] ❌ Контейнер настроек не найден!');
        return;
    }

    settingsContainer.innerHTML = '';

    // Получаем секции в порядке отображения
    const sections = Object.entries(SECTIONS_CONFIG)
        .map(([key, config]) => ({
            key,
            title: config.title,
            order: config.order
        }))
        .sort((a, b) => a.order - b.order);

    sections.forEach(section => {
        // Получаем настройки для этой секции
        const settings = SETTINGS_CONFIG
            .filter(setting => setting.section === section.key)
            .sort((a, b) => a.order - b.order);

        if (settings.length === 0) return;

        // Создаем div для секции
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'settings';

        // Заголовок секции
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'section-title';
        sectionTitle.textContent = section.title;
        sectionDiv.appendChild(sectionTitle);

        // Добавляем настройки
        settings.forEach(setting => {
            const settingItem = createSettingItem(setting);
            sectionDiv.appendChild(settingItem);
        });

        settingsContainer.appendChild(sectionDiv);
    });

    console.log('[Popup] ✅ UI сгенерирован автоматически');
}

function createSettingItem(setting) {
    const item = document.createElement('div');
    item.className = 'setting-item';

    const info = document.createElement('div');
    info.className = 'setting-info';

    const title = document.createElement('div');
    title.className = 'setting-title';
    title.textContent = setting.title;

    const description = document.createElement('div');
    description.className = 'setting-description';
    description.textContent = setting.description;

    info.appendChild(title);
    info.appendChild(description);

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'toggle-switch';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = setting.key;
    checkbox.setAttribute('data-setting-key', setting.key);

    const slider = document.createElement('span');
    slider.className = 'toggle-slider';

    toggleLabel.appendChild(checkbox);
    toggleLabel.appendChild(slider);

    item.appendChild(info);
    item.appendChild(toggleLabel);

    return item;
}

// ============================================================
// УПРАВЛЕНИЕ ТЕМОЙ
// ============================================================

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
        themeToggle.title = 'Переключить на светлую тему';
    } else {
        document.body.classList.remove('dark-theme');
        themeIcon.textContent = '🌙';
        themeToggle.title = 'Переключить на тёмную тему';
    }
}

async function toggleTheme() {
    try {
        const currentSettings = await new Promise((resolve) => {
            chrome.storage.sync.get({ darkTheme: false }, resolve);
        });
        
        const newDarkTheme = !currentSettings.darkTheme;
        
        await new Promise((resolve) => {
            chrome.storage.sync.set({ darkTheme: newDarkTheme }, resolve);
        });
        
        applyTheme(newDarkTheme);
        showStatusMessage(newDarkTheme ? '🌙 Тёмная тема' : '☀️ Светлая тема');
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('jut.su')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'THEME_CHANGED',
                    darkTheme: newDarkTheme
                }).catch(() => {});
            }
        });
    } catch (error) {
        console.error('[Popup] Ошибка переключения темы:', error);
    }
}

async function loadTheme() {
    try {
        chrome.storage.sync.get(['darkTheme'], (result) => {
            const isDark = result.darkTheme || false;
            applyTheme(isDark);
        });
    } catch (error) {
        console.error('[Popup] Ошибка загрузки темы:', error);
    }
}

// ============================================================
// УПРАВЛЕНИЕ НАСТРОЙКАМИ
// ============================================================

function getDefaultSettings() {
    const defaults = {};
    SETTINGS_CONFIG.forEach(setting => {
        defaults[setting.key] = setting.defaultValue;
    });
    defaults.darkTheme = false;
    return defaults;
}

async function loadSettings() {
    try {
        const defaults = getDefaultSettings();
        
        chrome.storage.sync.get(defaults, (settings) => {
            document.querySelectorAll('input[type="checkbox"][data-setting-key]').forEach(checkbox => {
                const key = checkbox.getAttribute('data-setting-key');
                if (key in settings) {
                    checkbox.checked = settings[key];
                }
            });
        });
    } catch (error) {
        console.error('[Popup] Ошибка загрузки настроек:', error);
    }
}

async function saveSettings() {
    try {
        const settings = {};
        
        document.querySelectorAll('input[type="checkbox"][data-setting-key]').forEach(checkbox => {
            const key = checkbox.getAttribute('data-setting-key');
            settings[key] = checkbox.checked;
        });
        
        chrome.storage.sync.set(settings, () => {
            showStatusMessage('Сохранено!');
            
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0] && tabs[0].url && tabs[0].url.includes('jut.su')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'STORAGE_CHANGED',
                        changes: settings
                    }).catch(() => {});
                }
            });
        });
    } catch (error) {
        console.error('[Popup] Ошибка сохранения настроек:', error);
        showStatusMessage('Ошибка!', false);
    }
}

async function resetSettings() {
    if (!confirm('Сбросить все настройки к значениям по умолчанию?')) {
        return;
    }
    
    try {
        const defaults = getDefaultSettings();
        
        chrome.storage.sync.set(defaults, () => {
            loadSettings();
            loadTheme();
            showStatusMessage('Сброшено!');
            
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0] && tabs[0].url && tabs[0].url.includes('jut.su')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'STORAGE_CHANGED',
                        changes: defaults
                    }).catch(() => {});
                }
            });
        });
    } catch (error) {
        console.error('[Popup] Ошибка сброса настроек:', error);
        showStatusMessage('Ошибка!', false);
    }
}

// ============================================================
// UI ФУНКЦИИ
// ============================================================

const statusMessage = document.getElementById('statusMessage');
const resetBtn = document.getElementById('resetBtn');
const closeBtn = document.getElementById('closeBtn');

function showStatusMessage(text, isSuccess = true) {
    const messageElement = statusMessage;
    const textElement = messageElement.querySelector('.status-text');
    
    textElement.textContent = text;
    
    if (isSuccess) {
        messageElement.classList.add('success');
        messageElement.classList.remove('error');
    } else {
        messageElement.classList.add('error');
        messageElement.classList.remove('success');
    }
    
    messageElement.classList.add('show');
    
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 2000);
}

function closePopup() {
    window.close();
}

// ============================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================================

resetBtn.addEventListener('click', resetSettings);
closeBtn.addEventListener('click', closePopup);
themeToggle.addEventListener('click', toggleTheme);

document.addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"][data-setting-key]')) {
        saveSettings();
    }
});

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    generatePopupHTML();
    loadTheme();
    loadSettings();
});