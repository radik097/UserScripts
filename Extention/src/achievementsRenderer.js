// ============================================================
// ФАЙЛ: src/achievementsRenderer.js (С ПОДДЕРЖКОЙ ТЕМ САЙТА)
// ============================================================

/**
 * Получить цвета для рендера в зависимости от темы сайта
 * Определяет тему через проверку класса 'dark_mode' на body
 * @returns {Object} Объект с цветовыми значениями для различных состояний
 */
function getRendererColors() {
    const isDark = document.body.classList.contains('dark_mode');
    
    if (isDark) {
        // Тёмная тема (соответствует стилям сайта)
        return {
            // Пустое состояние
            emptyBg: '#363a37',
            emptyBorder: '#535f53',
            emptyText: '#9a9aa0',
            emptyIcon: '#555',
            emptyShadow: '2px 2px 3px #535f53, inset 1px 1px 1px #535f53',
            
            // Состояние ошибки
            errorBg: '#3d2d2d',
            errorBorder: '#5d3d3d',
            errorText: '#ff6b6b',
            errorIcon: '#ff4444',
            errorShadow: '2px 2px 3px #535f53',
            
            // Заголовок списка
            headerColor: '#cdcdd3',
            headerBorder: '#535f53',
            countColor: '#bddc62',
            
            // Загрузка
            loadingBg: '#363a37',
            loadingText: '#9a9aa0',
            loadingSpinner: '#535f53',
            loadingSpinnerActive: '#bddc62'
        };
    } else {
        // Светлая тема (соответствует стилям сайта)
        return {
            // Пустое состояние
            emptyBg: '#eef5cd',
            emptyBorder: '#bddc62',
            emptyText: '#718096',
            emptyIcon: '#cbd5e0',
            emptyShadow: '2px 2px 3px #bddc62, inset 1px 1px 1px #bddc62',
            
            // Состояние ошибки
            errorBg: '#fff5f5',
            errorBorder: '#fed7d7',
            errorText: '#e53e3e',
            errorIcon: '#fc8181',
            errorShadow: '2px 2px 3px #bddc62',
            
            // Заголовок списка
            headerColor: '#2d3748',
            headerBorder: '#bddc62',
            countColor: '#667eea',
            
            // Загрузка
            loadingBg: '#eef5cd',
            loadingText: '#718096',
            loadingSpinner: '#bddc62',
            loadingSpinnerActive: '#667eea'
        };
    }
}

/**
 * Рендер пустого состояния (нет достижений)
 * Отображается когда для эпизода не найдено ни одного достижения
 * @param {Object} colors - Объект цветов (используется для совместимости)
 * @returns {HTMLElement} DOM элемент пустого состояния
 */
function renderEmptyState(colors) {
    const rendererColors = getRendererColors();
    
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'achievements-empty-state';
    emptyDiv.innerHTML = `
        <div style="
            padding: 40px 20px;
            text-align: center;
            background: ${rendererColors.emptyBg};
            border-radius: 10px;
            border: 2px dashed ${rendererColors.emptyBorder};
            box-shadow: ${rendererColors.emptyShadow};
            font-family: verdana, sans-serif;
        ">
            <div style="
                font-size: 48px;
                margin-bottom: 12px;
                opacity: 0.5;
                color: ${rendererColors.emptyIcon};
            ">
                🏆
            </div>
            <div style="
                font-size: 14px;
                font-weight: 600;
                color: ${rendererColors.emptyText};
                margin-bottom: 6px;
                font-family: verdana, sans-serif;
            ">
                Достижения не найдены
            </div>
            <div style="
                font-size: 12px;
                color: ${rendererColors.emptyText};
                opacity: 0.8;
                line-height: 1.5;
                font-family: verdana, sans-serif;
            ">
                Для этого эпизода пока нет доступных достижений
            </div>
        </div>
    `;
    return emptyDiv;
}

/**
 * Рендер ошибки
 * Отображается при возникновении ошибки загрузки достижений
 * @param {Object} colors - Объект цветов (используется для совместимости)
 * @returns {HTMLElement} DOM элемент состояния ошибки
 */
function renderError(colors) {
    const rendererColors = getRendererColors();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'achievements-error-state';
    errorDiv.innerHTML = `
        <div style="
            padding: 30px 20px;
            text-align: center;
            background: ${rendererColors.errorBg};
            border-radius: 10px;
            border: 1px solid ${rendererColors.errorBorder};
            box-shadow: ${rendererColors.errorShadow};
            font-family: verdana, sans-serif;
        ">
            <div style="
                font-size: 40px;
                margin-bottom: 12px;
                color: ${rendererColors.errorIcon};
            ">
                ⚠️
            </div>
            <div style="
                font-size: 14px;
                font-weight: 600;
                color: ${rendererColors.errorText};
                margin-bottom: 6px;
                font-family: verdana, sans-serif;
            ">
                Ошибка загрузки
            </div>
            <div style="
                font-size: 12px;
                color: ${rendererColors.errorText};
                opacity: 0.9;
                line-height: 1.5;
                font-family: verdana, sans-serif;
            ">
                Не удалось загрузить достижения. Попробуйте позже.
            </div>
        </div>
    `;
    return errorDiv;
}

/**
 * Рендер состояния загрузки (опционально)
 * Отображается во время загрузки достижений
 * @param {Object} colors - Объект цветов (используется для совместимости)
 * @returns {HTMLElement} DOM элемент состояния загрузки
 */
function renderLoading(colors) {
    const rendererColors = getRendererColors();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'achievements-loading-state';
    loadingDiv.innerHTML = `
        <div style="
            padding: 40px 20px;
            text-align: center;
            background: ${rendererColors.loadingBg};
            border-radius: 10px;
            font-family: verdana, sans-serif;
        ">
            <div style="
                display: inline-block;
                width: 40px;
                height: 40px;
                border: 3px solid ${rendererColors.loadingSpinner};
                border-top-color: ${rendererColors.loadingSpinnerActive};
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-bottom: 12px;
            "></div>
            <div style="
                font-size: 13px;
                color: ${rendererColors.loadingText};
                font-family: verdana, sans-serif;
            ">
                Загрузка достижений...
            </div>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    return loadingDiv;
}

/**
 * Рендер списка достижений
 * Основная функция для отображения списка достижений или пустого состояния
 * @param {Array} achievements - Массив объектов достижений
 * @param {Object} colors - Объект цветов (используется для совместимости)
 * @returns {HTMLElement} DOM элемент со списком достижений
 */
function renderAchievementsList(achievements, colors) {
    const contentDiv = document.createElement('div');
    contentDiv.id = 'achievementsContent';
    contentDiv.className = 'achievements-list';

    if (achievements.length === 0) {
        // Если достижений нет, показываем пустое состояние
        contentDiv.appendChild(renderEmptyState(colors));
    } else {
        // Добавляем заголовок с количеством достижений
        const rendererColors = getRendererColors();
        
        const header = document.createElement('div');
        header.style.cssText = `
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid ${rendererColors.headerBorder};
            font-family: verdana, sans-serif;
        `;
        header.innerHTML = `
            <span style="
                font-size: 14px;
                font-weight: 600;
                color: ${rendererColors.headerColor};
                font-family: verdana, sans-serif;
            ">
                Найдено достижений: 
            </span>
            <span style="
                font-size: 14px;
                font-weight: 700;
                color: ${rendererColors.countColor};
                font-family: verdana, sans-serif;
            ">
                ${achievements.length}
            </span>
        `;
        contentDiv.appendChild(header);

        // Добавляем карточки достижений
        achievements.forEach(achievement => {
            const card = createAchievementCard(achievement, colors);
            contentDiv.appendChild(card);
        });
    }

    return contentDiv;
}

/**
 * Обновить цвета всех состояний при смене темы
 * Вызывается когда пользователь переключает тему на сайте
 */
function updateRendererTheme() {
    const rendererColors = getRendererColors();
    
    // Обновляем пустое состояние
    const emptyState = document.querySelector('.achievements-empty-state > div');
    if (emptyState) {
        emptyState.style.background = rendererColors.emptyBg;
        emptyState.style.borderColor = rendererColors.emptyBorder;
        emptyState.style.boxShadow = rendererColors.emptyShadow;
        
        const icon = emptyState.querySelector('div:first-child');
        if (icon) icon.style.color = rendererColors.emptyIcon;
        
        const texts = emptyState.querySelectorAll('div:not(:first-child)');
        texts.forEach(text => {
            text.style.color = rendererColors.emptyText;
        });
    }
    
    // Обновляем состояние ошибки
    const errorState = document.querySelector('.achievements-error-state > div');
    if (errorState) {
        errorState.style.background = rendererColors.errorBg;
        errorState.style.borderColor = rendererColors.errorBorder;
        errorState.style.boxShadow = rendererColors.errorShadow;
        
        const icon = errorState.querySelector('div:first-child');
        if (icon) icon.style.color = rendererColors.errorIcon;
        
        const texts = errorState.querySelectorAll('div:not(:first-child)');
        texts.forEach(text => {
            text.style.color = rendererColors.errorText;
        });
    }
    
    // Обновляем заголовок списка
    const header = document.querySelector('.achievements-list > div:first-child');
    if (header && header.querySelector('span')) {
        header.style.borderBottomColor = rendererColors.headerBorder;
        
        const titleSpan = header.querySelector('span:first-child');
        if (titleSpan) titleSpan.style.color = rendererColors.headerColor;
        
        const countSpan = header.querySelector('span:last-child');
        if (countSpan) countSpan.style.color = rendererColors.countColor;
    }
    
    // Обновляем состояние загрузки
    const loadingState = document.querySelector('.achievements-loading-state > div');
    if (loadingState) {
        loadingState.style.background = rendererColors.loadingBg;
        
        const spinner = loadingState.querySelector('div:first-child');
        if (spinner) {
            spinner.style.borderColor = rendererColors.loadingSpinner;
            spinner.style.borderTopColor = rendererColors.loadingSpinnerActive;
        }
        
        const text = loadingState.querySelector('div:last-child');
        if (text) text.style.color = rendererColors.loadingText;
    }
    
    // Обновляем карточки достижений
    if (typeof updateAchievementCardsTheme === 'function') {
        updateAchievementCardsTheme();
    }
}