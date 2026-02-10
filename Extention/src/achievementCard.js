// ============================================================
// ФАЙЛ: src/achievementCard.js (С ПОДДЕРЖКОЙ ТЕМ САЙТА)
// ============================================================

/**
 * Получить цвета для карточки достижения в зависимости от темы сайта
 * Проверяет наличие класса 'dark_mode' на body для определения тёмной темы
 * @returns {Object} Объект с цветовыми значениями для карточки
 */
// ============================================================
// КОНФИГУРАЦИЯ ЦВЕТОВ ДЛЯ СИСТЕМЫ ДОСТИЖЕНИЙ
// ============================================================

/**
 * Получить цвета для карточки достижения в зависимости от темы сайта
 * @returns {Object} Объект с цветовыми значениями для карточки
 */
function getAchievementCardColors() {
    const isDark = document.body.classList.contains('dark_mode');
    
    if (isDark) {
        // ===== ТЁМНАЯ ТЕМА =====
        return {
            // --- Основа карточки ---
            background: '#2d2d2d',              // Фон карточки (тёмно-серый)
            border: '#3d3d3d',                  // Граница карточки (чуть светлее фона)
            shadow: '0 2px 8px rgba(0, 0, 0, 0.3)', // Тень карточки
            
            // --- Текст внутри карточки ---
            titleColor: '#e0e0e0',              // Заголовок достижения (светло-серый)
            descColor: '#b0b0b0',               // Описание достижения (серый)
            
            // --- Иконка достижения ---
            iconBg: 'rgba(168, 217, 95, 0.2)',  // Фон иконки (полупрозрачный зелёный)
            iconColor: '#a8d95f',               // Цвет самой иконки emoji (не применяется к emoji)
            
            // --- Кнопка "Перейти к моменту" ---
            linkBg: 'rgb(155 168 120)',                  // Фон кнопки (зелёный как на сайте)
            linkBgHover: '#a1b866',             // Фон кнопки при наведении (темнее)
            linkColor: '#1f1f1f',               // Цвет текста кнопки (тёмный)
            linkBorder: '#a1b866',              // Граница кнопки
            
            // --- Время в кнопке ---
            timeColor: '#2d2d2d'                // Цвет времени справа в кнопке (тёмный)
        };
    } else {
        // ===== СВЕТЛАЯ ТЕМА =====
        return {
            // --- Основа карточки ---
            background: '#eef5cd',              // Фон карточки (светло-салатовый)
            border: '#bddc62',                  // Граница карточки (салатовый)
            shadow: '0 2px 8px rgba(189, 220, 98, 0.15)', // Тень карточки (салатовая)
            
            // --- Текст внутри карточки ---
            titleColor: '#1a202c',              // Заголовок достижения (тёмный)
            descColor: '#4a5568',               // Описание достижения (серый)
            
            // --- Иконка достижения ---
            iconBg: 'rgba(157, 197, 50, 0.15)', // Фон иконки (полупрозрачный зелёный)
            iconColor: '#9dc532',               // Цвет иконки (не применяется к emoji)
            
            // --- Кнопка "Перейти к моменту" ---
            linkBg: '#9dc532',                  // Фон кнопки (зелёный как на сайте)
            linkBgHover: '#8ab02b',             // Фон кнопки при наведении (темнее)
            linkColor: '#ffffff',               // Цвет текста кнопки (белый)
            linkBorder: '#9dc532',              // Граница кнопки
            
            // --- Время в кнопке ---
            timeColor: '#e8f5d5'                // Цвет времени справа в кнопке (светло-зелёный)
        };
    }
}

/**
 * Получить цвета для рендера состояний в зависимости от темы сайта
 * @returns {Object} Объект с цветовыми значениями для различных состояний
 */
function getRendererColors() {
    const isDark = document.body.classList.contains('dark_mode');
    
    if (isDark) {
        // ===== ТЁМНАЯ ТЕМА =====
        return {
            // --- Пустое состояние (нет достижений) ---
            emptyBg: '#2d2d2d',                 // Фон блока "нет достижений"
            emptyBorder: '#3d3d3d',             // Пунктирная граница
            emptyText: '#b0b0b0',               // Цвет текста "Достижения не найдены"
            emptyIcon: '#555',                  // Цвет иконки 🏆 (фильтр для emoji)
            emptyShadow: '0 2px 8px rgba(0, 0, 0, 0.3)', // Тень блока
            
            // --- Состояние ошибки ---
            errorBg: '#3d2d2d',                 // Фон блока ошибки (красноватый)
            errorBorder: '#5d3d3d',             // Граница блока ошибки
            errorText: '#ff6b6b',               // Цвет текста ошибки (красный)
            errorIcon: '#ff4444',               // Цвет иконки ⚠️
            errorShadow: '0 2px 8px rgba(0, 0, 0, 0.3)', // Тень блока
            
            // --- Заголовок списка "Найдено достижений: N" ---
            headerColor: '#e0e0e0',             // Цвет текста "Найдено достижений:"
            headerBorder: '#3d3d3d',            // Линия под заголовком
            countColor: '#a1b866',              // Цвет числа достижений (зелёный)
            
            // --- Состояние загрузки ---
            loadingBg: '#2d2d2d',               // Фон блока загрузки
            loadingText: '#b0b0b0',             // Цвет текста "Загрузка достижений..."
            loadingSpinner: '#3d3d3d',          // Цвет основной части спиннера
            loadingSpinnerActive: '#a1b866'     // Цвет активной части спиннера (зелёный)
        };
    } else {
        // ===== СВЕТЛАЯ ТЕМА =====
        return {
            // --- Пустое состояние (нет достижений) ---
            emptyBg: '#f8fde7',                 // Фон блока "нет достижений"
            emptyBorder: '#d4e88f',             // Пунктирная граница
            emptyText: '#4a5568',               // Цвет текста "Достижения не найдены"
            emptyIcon: '#cbd5e0',               // Цвет иконки 🏆
            emptyShadow: '0 2px 8px rgba(189, 220, 98, 0.15)', // Тень блока
            
            // --- Состояние ошибки ---
            errorBg: '#fff5f5',                 // Фон блока ошибки (светло-красный)
            errorBorder: '#fed7d7',             // Граница блока ошибки
            errorText: '#e53e3e',               // Цвет текста ошибки (красный)
            errorIcon: '#fc8181',               // Цвет иконки ⚠️
            errorShadow: '0 2px 8px rgba(189, 220, 98, 0.15)', // Тень блока
            
            // --- Заголовок списка "Найдено достижений: N" ---
            headerColor: '#1a202c',             // Цвет текста "Найдено достижений:"
            headerBorder: '#d4e88f',            // Линия под заголовком
            countColor: '#9dc532',              // Цвет числа достижений (зелёный)
            
            // --- Состояние загрузки ---
            loadingBg: '#f8fde7',               // Фон блока загрузки
            loadingText: '#4a5568',             // Цвет текста "Загрузка достижений..."
            loadingSpinner: '#d4e88f',          // Цвет основной части спиннера
            loadingSpinnerActive: '#9dc532'     // Цвет активной части спиннера (зелёный)
        };
    }
}

// ============================================================
// ОПИСАНИЕ ЭЛЕМЕНТОВ И ИХ НАЗНАЧЕНИЕ
// ============================================================

/*
КАРТОЧКА ДОСТИЖЕНИЯ (getAchievementCardColors):
┌─────────────────────────────────────────┐
│ background, border, shadow              │ ← Основа карточки
│ ┌─────┐                                 │
│ │ 🏆  │ titleColor  ← Заголовок        │
│ │icon │ descColor   ← Описание         │
│ │Bg   │                                 │
│ └─────┘ ┌───────────────────────────┐  │
│         │ ▶ Перейти | timeColor     │  │ ← Кнопка
│         │   linkBg, linkColor       │  │
│         └───────────────────────────┘  │
└─────────────────────────────────────────┘

СОСТОЯНИЯ (getRendererColors):

1. ПУСТОЕ СОСТОЯНИЕ:
   ┌──────────────────────┐
   │   emptyBg, border    │
   │       🏆             │ ← emptyIcon
   │  Достижения не       │ ← emptyText
   │     найдены          │
   └──────────────────────┘

2. ОШИБКА:
   ┌──────────────────────┐
   │   errorBg, border    │
   │       ⚠️             │ ← errorIcon
   │  Ошибка загрузки     │ ← errorText
   └──────────────────────┘

3. ЗАГОЛОВОК СПИСКА:
   Найдено достижений: 5
   ^^^^^^^^^^^^^^^^^^^  ^
   headerColor     countColor
   ─────────────────────────
   headerBorder

4. ЗАГРУЗКА:
   ┌──────────────────────┐
   │    loadingBg         │
   │       ⭕ ← spinner   │
   │  Загрузка...         │ ← loadingText
   └──────────────────────┘
*/

/**
 * Создание карточки достижения
 * @param {Object} achievement - Объект достижения с полями: icon, title, description, time_start
 * @param {Object} colors - Объект цветов (используется для совместимости, но переопределяется внутри)
 * @returns {HTMLElement} DOM элемент карточки достижения
 */
function createAchievementCard(achievement, colors) {
    // Получаем актуальные цвета темы сайта
    const cardColors = getAchievementCardColors();
    
    const item = document.createElement('div');
    item.className = 'achievement-card';
    item.style.cssText = `
        margin-bottom: 15px;
        padding: 15px;
        background: ${cardColors.background};
        border-radius: 10px;
        border: 1px solid ${cardColors.border};
        box-shadow: ${cardColors.shadow};
        transition: all 0.2s ease;
        font-family: verdana, sans-serif;
    `;

    // Форматируем время начала достижения
    const wheretime = formatTime(achievement.time_start);
    const link = `${window.location.origin}${window.location.pathname}?t=${wheretime.hours}h${wheretime.minutes}m${wheretime.seconds}s`;

    item.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            ${achievement.icon ? `
                <div style="
                    flex-shrink: 0;
                    width: 54px;
                    height: 54px;
                    background: ${cardColors.iconBg};
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                ">
                    <img src="${achievement.icon}" alt="" style="width: 49px; height: 49px; border-radius: 8px;">
                </div>
            ` : ''}
            
            <div style="flex: 1; min-width: 0;">
                <div style="
                    font-size: 14px;
                    font-weight: 600;
                    color: ${cardColors.titleColor};
                    margin-bottom: 5px;
                    font-family: verdana, sans-serif;
                ">
                    ${achievement.title}
                </div>
                <div style="
                    font-size: 12px;
                    color: ${cardColors.descColor};
                    margin-bottom: 10px;
                    line-height: 1.5;
                    font-family: verdana, sans-serif;
                ">
                    ${achievement.description}
                </div>
                <a href="${link}" class="achievement-link" style="
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: ${cardColors.linkBg};
                    color: ${cardColors.linkColor};
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    border: 1px solid ${cardColors.border};
                    font-family: verdana, sans-serif;
                ">
                    <span style="font-size: 13px;">▶</span>
                    <span>Перейти к моменту</span>
                    <span style="
                        color: ${cardColors.timeColor};
                        font-size: 10px;
                        margin-left: 2px;
                    ">
                        ${wheretime.hours}:${String(wheretime.minutes).padStart(2, '0')}:${String(wheretime.seconds).padStart(2, '0')}
                    </span>
                </a>
            </div>
        </div>
    `;

    // Обработчик наведения на ссылку
    const linkEl = item.querySelector('.achievement-link');
    linkEl.addEventListener('mouseenter', () => {
        linkEl.style.background = cardColors.linkBgHover;
        linkEl.style.transform = 'translateX(2px)';
    });
    linkEl.addEventListener('mouseleave', () => {
        linkEl.style.background = cardColors.linkBg;
        linkEl.style.transform = 'translateX(0)';
    });

    // Обработчик наведения на всю карточку
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-2px)';
        const isDark = document.body.classList.contains('dark_mode');
        item.style.boxShadow = isDark ? 
            '3px 3px 5px #535f53, inset 2px 2px 2px #535f53' : 
            '3px 3px 5px #bddc62, inset 2px 2px 2px #bddc62';
    });
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0)';
        item.style.boxShadow = cardColors.shadow;
    });

    return item;
}

/**
 * Проверка тёмной темы
 * @returns {boolean} true если включена тёмная тема
 */
function isDarkTheme() {
    return document.body.classList.contains('dark_mode');
}

/**
 * Обновить цвета всех карточек при смене темы
 * Вызывается когда пользователь переключает тему на сайте
 */
function updateAchievementCardsTheme() {
    const cards = document.querySelectorAll('.achievement-card');
    const cardColors = getAchievementCardColors();
    
    cards.forEach(card => {
        // Обновляем основные стили карточки
        card.style.background = cardColors.background;
        card.style.borderColor = cardColors.border;
        card.style.boxShadow = cardColors.shadow;
        
        // Обновляем цвет заголовка
        const title = card.querySelector('div > div:nth-child(2) > div:first-child');
        if (title) title.style.color = cardColors.titleColor;
        
        // Обновляем цвет описания
        const desc = card.querySelector('div > div:nth-child(2) > div:nth-child(2)');
        if (desc) desc.style.color = cardColors.descColor;
        
        // Обновляем стили ссылки
        const link = card.querySelector('.achievement-link');
        if (link) {
            link.style.background = cardColors.linkBg;
            link.style.color = cardColors.linkColor;
            link.style.borderColor = cardColors.border;
        }
        
        // Обновляем цвет времени
        const timeSpan = card.querySelector('.achievement-link span:last-child');
        if (timeSpan) timeSpan.style.color = cardColors.timeColor;
        
        // Обновляем фон иконки
        const icon = card.querySelector('div > div:first-child');
        if (icon && icon.textContent.trim()) {
            icon.style.background = cardColors.iconBg;
        }
    });
}