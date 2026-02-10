// ============================================================
// ФАЙЛ: src/userAnimePage.js
// Модуль для работы со страницей /user/*/anime/
// С ПОДДЕРЖКОЙ СИНХРОНИЗАЦИИ ТЕМЫ
// ============================================================

// Класс для управления страницей аниме пользователя
class UserAnimePage {
    constructor() {
        this.currentPath = window.location.pathname;
        this.themeObserver = null;
    }

    /**
     * Проверка темной темы (как в chatWidget.js)
     * @returns {boolean}
     */
    isDarkMode() {
        return document.body.classList.contains('dark_mode');
    }

    /**
     * Получить стили в зависимости от темы (как в chatWidget.js)
     * @returns {object}
     */
    getThemeStyles() {
        const isDark = this.isDarkMode();
        
        if (isDark) {
            return {
                // Тёмная тема
                background: '#363a37',
                border: '#666d43',
                headerBg: '#363a37',
                headerColor: '#7b8254',
                contentBg: '#363a37',
                contentColor: '#7b8254',
                cardBg: '#2d302e',
                cardBorder: '#666d43',
                labelColor: '#5a6340',
                valueColor: '#7b8254',
                highlightColor: '#adbd5b',
                watermarkColor: 'rgba(123, 130, 84, 0.03)'
            };
        } else {
            return {
                // Светлая тема
                background: '#eef5cd',
                border: '#bddc62',
                headerBg: '#eef5cd',
                headerColor: '#5a6340',
                contentBg: '#eef5cd',
                contentColor: '#5a6340',
                cardBg: '#ffffff',
                cardBorder: '#bddc62',
                labelColor: '#7a8050',
                valueColor: '#4a5030',
                highlightColor: '#6a7a2b',
                watermarkColor: 'rgba(90, 99, 64, 0.06)'
            };
        }
    }

    /**
     * Настройка наблюдателя за изменением темы (как в chatWidget.js)
     */
    setupThemeObserver() {
        if (this.themeObserver) {
            return;
        }
        
        this.themeObserver = new MutationObserver(() => {
            // Когда тема меняется, обновляем стили блока
            this.updateBlockTheme();
        });
        
        this.themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    /**
     * Обновить тему блока статистики
     */
    updateBlockTheme() {
        const statsBlock = document.querySelector('.user-anime-stats-block');
        if (!statsBlock) return;

        const styles = this.getThemeStyles();

        // Обновляем основной контейнер
        statsBlock.style.background = styles.background;
        statsBlock.style.borderColor = styles.border;

        // Обновляем заголовок
        const header = statsBlock.querySelector('[data-stats-header]');
        if (header) {
            header.style.background = styles.headerBg;
            header.style.color = styles.headerColor;
            header.style.borderColor = styles.border;
        }

        // Обновляем контент
        const content = statsBlock.querySelector('[data-stats-content]');
        if (content) {
            content.style.background = styles.contentBg;
            content.style.color = styles.contentColor;
            content.style.borderColor = styles.border;
        }

        // Обновляем водяной знак
        const watermark = statsBlock.querySelector('[data-watermark]');
        if (watermark) {
            watermark.style.color = styles.watermarkColor;
        }

        // Обновляем карточки
        const cards = statsBlock.querySelectorAll('[data-stat-card]');
        cards.forEach(card => {
            card.style.background = styles.cardBg;
            card.style.borderColor = styles.cardBorder;
        });

        // Обновляем лейблы
        const labels = statsBlock.querySelectorAll('[data-stat-label]');
        labels.forEach(label => {
            label.style.color = styles.labelColor;
        });

        // Обновляем значения
        const values = statsBlock.querySelectorAll('[data-stat-value]');
        values.forEach(value => {
            value.style.color = styles.valueColor;
        });

        // Обновляем выделенные значения
        const highlights = statsBlock.querySelectorAll('[data-stat-highlight]');
        highlights.forEach(highlight => {
            highlight.style.color = styles.highlightColor;
        });

        // Обновляем кнопки действий (Загрузить все, Обновить)
        const actionButtons = statsBlock.querySelectorAll('[data-action-button]');
        actionButtons.forEach(button => {
            button.style.background = styles.cardBg;
            button.style.color = styles.valueColor;
            button.style.borderColor = styles.border;
        });

        // Обновляем главную кнопку "Поделиться"
        const shareButton = statsBlock.querySelector('[data-share-button]');
        if (shareButton) {
            shareButton.style.background = styles.highlightColor;
            shareButton.style.borderColor = styles.border;
        }

        // Обновляем меню поделиться
        const shareMenu = statsBlock.querySelector('[data-share-menu]');
        if (shareMenu) {
            shareMenu.style.background = styles.cardBg;
            shareMenu.style.borderColor = styles.border;
        }

        // Обновляем кнопки в меню (Копировать, Скачать)
        const menuButtons = statsBlock.querySelectorAll('[data-menu-button]');
        menuButtons.forEach(button => {
            button.style.background = styles.contentBg;
            button.style.color = styles.valueColor;
            button.style.borderColor = styles.border;
        });

        // Социальные кнопки (Telegram, VK, Twitter) остаются с фиксированными цветами
        const socialButtons = statsBlock.querySelectorAll('[data-social-button]');
        socialButtons.forEach(button => {
            button.style.borderColor = styles.border;
        });
    }

    /**
     * Проверить, находимся ли мы на странице /user/
     * @returns {boolean}
     */
    isUserAnimePage() {
        const pattern = /^\/user\/[^\/]+\/anime\/?$/;
        return pattern.test(this.currentPath);
    }

    /**
     * Получить никнейм пользователя из URL
     * @returns {string|null}
     */
    getUsernameFromUrl() {
        const match = this.currentPath.match(/^\/user\/([^\/]+)\/anime\/?$/);
        return match ? match[1] : null;
    }

    /**
     * Парсинг информации из блока .aailines
     * @param {string} text - текст типа "49 серий" или "2 сезона\n49 серий\n1 фильм"
     * @returns {object} - {series: number, movies: number}
     */
    parseAnimeInfo(text) {
        if (!text) return { series: 0, movies: 0 };
        
        let series = 0;
        let movies = 0;
        
        // Ищем серии
        const seriesMatch = text.match(/(\d+)\s*сери[йия]/i);
        if (seriesMatch) {
            series = parseInt(seriesMatch[1]);
        }
        
        // Ищем фильмы
        const moviesMatch = text.match(/(\d+)\s*фильм/i);
        if (moviesMatch) {
            movies = parseInt(moviesMatch[1]);
        }
        
        return { series, movies };
    }

    /**
     * Получить рейтинг аниме (количество активных звёзд)
     * @param {HTMLElement} animeBlock - блок аниме
     * @returns {number} - рейтинг от 0 до 5
     */
    getAnimeRating(animeBlock) {
        const activeStars = animeBlock.querySelectorAll('.asr_rating .av_active');
        if (activeStars.length === 0) return 0;
        
        // Берём последнюю активную звезду (она показывает рейтинг)
        const lastActiveStar = activeStars[activeStars.length - 1];
        const ratingText = lastActiveStar.textContent.trim();
        return parseInt(ratingText) || 0;
    }

    /**
     * Собрать статистику по всем просмотренным аниме
     * @returns {object}
     */
    collectStatistics() {
        const animeBlocks = document.querySelectorAll('.all_anime_global.this_anime_is_viewed');
        
        let totalSeries = 0;
        let totalMovies = 0;
        let totalAnime = animeBlocks.length;
        let totalRating = 0;
        let ratedAnime = 0;

        animeBlocks.forEach(block => {
            // Получаем текст с количеством серий/фильмов
            const linesDiv = block.querySelector('.aailines');
            if (linesDiv) {
                const text = linesDiv.textContent.trim();
                const parsed = this.parseAnimeInfo(text);
                
                totalSeries += parsed.series;
                totalMovies += parsed.movies;
            }

            // Получаем рейтинг
            const rating = this.getAnimeRating(block);
            if (rating > 0) {
                totalRating += rating;
                ratedAnime++;
            }
        });

        // Расчёт времени
        const seriesTimeMinutes = totalSeries * 23.4; // 23.4 минуты на серию
        const moviesTimeMinutes = totalMovies * 90; // 90 минут на фильм
        const totalTimeMinutes = seriesTimeMinutes + moviesTimeMinutes;

        // Средний рейтинг
        const averageRating = ratedAnime > 0 ? (totalRating / ratedAnime).toFixed(1) : 0;

        return {
            totalAnime,
            totalSeries,
            totalMovies,
            averageRating,
            totalTimeMinutes,
            totalTimeHours: (totalTimeMinutes / 60).toFixed(1),
            totalTimeDays: (totalTimeMinutes / 60 / 24).toFixed(1)
        };
    }

    /**
     * Форматирование числа с правильным склонением
     * @param {number} number
     * @param {array} words - ['серия', 'серии', 'серий']
     * @returns {string}
     */
    pluralize(number, words) {
        const cases = [2, 0, 1, 1, 1, 2];
        return words[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[Math.min(number % 10, 5)]];
    }

    /**
     * Создать HTML блок со статистикой с адаптивными стилями темы
     * @param {object} stats
     * @returns {string}
     */
    createStatsHTML(stats) {
        const styles = this.getThemeStyles();
        
        return `
<div class="mailBlock_h user-anime-stats-block" style="
    font: 12px/1.5 verdana,sans-serif;
    text-align: center;
    box-sizing: border-box;
    margin: 0 auto 30px;
    margin-bottom: 0;
    background: ${styles.background};
    border: 1px solid ${styles.border};
">
    <div data-stats-header style="
        font-weight: normal;
        font-size: 19px;
        padding: 10px;
        border: 1px solid ${styles.border};
        border-top: none;
        background: ${styles.headerBg};
        color: ${styles.headerColor};
        position: relative;
    ">
        📊 Статистика просмотренного
    </div>
    
    <div data-stats-content style="
        background: ${styles.contentBg};
        border: 1px solid ${styles.border};
        border-top: none;
        padding: 20px 10px;
        color: ${styles.contentColor};
        position: relative;
        overflow: hidden;
    ">
        <!-- Водяной знак -->
        <div data-watermark style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(340deg);
            font-size: 60px;
            font-weight: bold;
            color: ${styles.watermarkColor};
            pointer-events: none;
            white-space: nowrap;
            user-select: none;
            z-index: 5000;
        ">jutsu.fun</div>
        
        <!-- Основная статистика -->
        <div style="position: relative; z-index: 10;"
            ><div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        ">
            <div data-stat-card style="padding: 10px; background: ${styles.cardBg}; border: 1px solid ${styles.cardBorder};">
                <div data-stat-label style="font-size: 11px; color: ${styles.labelColor}; margin-bottom: 5px;">АНИМЕ</div>
                <div data-stat-value style="font-size: 24px; font-weight: bold; color: ${styles.valueColor};">${stats.totalAnime}</div>
            </div>
            
            <div data-stat-card style="padding: 10px; background: ${styles.cardBg}; border: 1px solid ${styles.cardBorder};">
                <div data-stat-label style="font-size: 11px; color: ${styles.labelColor}; margin-bottom: 5px;">СЕРИЙ</div>
                <div data-stat-value style="font-size: 24px; font-weight: bold; color: ${styles.valueColor};">${stats.totalSeries}</div>
            </div>
            
            <div data-stat-card style="padding: 10px; background: ${styles.cardBg}; border: 1px solid ${styles.cardBorder};">
                <div data-stat-label style="font-size: 11px; color: ${styles.labelColor}; margin-bottom: 5px;">ФИЛЬМОВ</div>
                <div data-stat-value style="font-size: 24px; font-weight: bold; color: ${styles.valueColor};">${stats.totalMovies}</div>
            </div>
            
            <div data-stat-card style="padding: 10px; background: ${styles.cardBg}; border: 1px solid ${styles.cardBorder};">
                <div data-stat-label style="font-size: 11px; color: ${styles.labelColor}; margin-bottom: 5px;">СР. ОЦЕНКА</div>
                <div data-stat-highlight style="font-size: 24px; font-weight: bold; color: ${styles.highlightColor};">
                    ${stats.averageRating} <span style="font-size: 16px;">★</span>
                </div>
            </div>
        </div>
        
        <!-- Время просмотра -->
        <div data-stat-card style="
            padding: 15px;
            background: ${styles.cardBg};
            border: 1px solid ${styles.cardBorder};
            margin-bottom: 10px;
        ">
            <div data-stat-label style="font-size: 11px; color: ${styles.labelColor}; margin-bottom: 8px;">⏱️ ВРЕМЯ ПРОСМОТРА</div>
            <div data-stat-highlight style="font-size: 20px; font-weight: bold; color: ${styles.highlightColor};">
                ${stats.totalTimeHours} ${this.pluralize(Math.floor(parseFloat(stats.totalTimeHours)), ['час', 'часа', 'часов'])}
            </div>
            <div data-stat-value style="font-size: 14px; color: ${styles.valueColor}; margin-top: 5px;">
                ≈ ${stats.totalTimeDays} ${this.pluralize(Math.floor(parseFloat(stats.totalTimeDays)), ['день', 'дня', 'дней'])}
            </div>
            <div data-stat-label style="font-size: 10px; color: ${styles.labelColor}; margin-top: 8px;">
                серия ≈ 23.4 мин • фильм ≈ 90 мин
            </div>
            </div>
        </div>
        
        <!-- Кнопки -->
        <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
        ">
            <button data-action-button id="loadAllAnimeBtn" style="
                padding: 10px;
                border: 1px solid ${styles.border};
                background: ${styles.cardBg};
                color: ${styles.valueColor};
                cursor: pointer;
                border-radius: 5px;
                font-size: 11px;
                font-weight: bold;
                transition: all 0.2s;
            " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                ⚡ Загрузить все
            </button>
            
            <button data-action-button id="refreshAnimeStats" style="
                padding: 10px;
                border: 1px solid ${styles.border};
                background: ${styles.cardBg};
                color: ${styles.valueColor};
                cursor: pointer;
                border-radius: 5px;
                font-size: 11px;
                font-weight: bold;
                transition: all 0.2s;
            " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                🔄 Обновить
            </button>
        </div>
        
        <!-- Кнопка "Поделиться" -->
        <div style="margin-top: 10px;">
            <button data-share-button id="shareStatsBtn" style="
                width: 100%;
                padding: 10px;
                border: 1px solid ${styles.border};
                background: ${styles.highlightColor};
                color: white;
                cursor: pointer;
                border-radius: 5px;
                font-size: 12px;
                font-weight: bold;
                transition: all 0.2s;
            " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                📤 Поделиться статистикой
            </button>
        </div>
        
        <!-- Скрытое меню поделиться -->
        <div id="shareStatsMenu" data-share-menu style="
            display: none;
            margin-top: 10px;
            padding: 10px;
            background: ${styles.cardBg};
            border: 1px solid ${styles.border};
            border-radius: 5px;
        ">
            <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 8px;
            ">
                <button data-menu-button id="copyStatsBtn" style="
                    padding: 8px;
                    border: 1px solid ${styles.border};
                    background: ${styles.contentBg};
                    color: ${styles.valueColor};
                    cursor: pointer;
                    border-radius: 5px;
                    font-size: 10px;
                    transition: all 0.2s;
                " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                    📋 Копировать текст
                </button>
                
                <button data-social-button id="shareTelegramBtn" style="
                    padding: 8px;
                    border: 1px solid ${styles.border};
                    background: #0088cc;
                    color: white;
                    cursor: pointer;
                    border-radius: 5px;
                    font-size: 10px;
                    transition: all 0.2s;
                " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                    📱 Telegram
                </button>
                
                <button data-social-button id="shareVKBtn" style="
                    padding: 8px;
                    border: 1px solid ${styles.border};
                    background: #4680C2;
                    color: white;
                    cursor: pointer;
                    border-radius: 5px;
                    font-size: 10px;
                    transition: all 0.2s;
                " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                    🌐 VK
                </button>
                
                <button data-social-button id="shareTwitterBtn" style="
                    padding: 8px;
                    border: 1px solid ${styles.border};
                    background: #1DA1F2;
                    color: white;
                    cursor: pointer;
                    border-radius: 5px;
                    font-size: 10px;
                    transition: all 0.2s;
                " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                    🐦 Twitter
                </button>
            </div>
            
            <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            ">
                <button data-menu-button id="downloadStatsBtn" style="
                    padding: 8px;
                    border: 1px solid ${styles.border};
                    background: ${styles.contentBg};
                    color: ${styles.valueColor};
                    cursor: pointer;
                    border-radius: 5px;
                    font-size: 10px;
                    transition: all 0.2s;
                " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                    💾 Скачать TXT
                </button>
                
                <button data-menu-button id="downloadImageBtn" style="
                    padding: 8px;
                    border: 1px solid ${styles.border};
                    background: ${styles.contentBg};
                    color: ${styles.valueColor};
                    cursor: pointer;
                    border-radius: 5px;
                    font-size: 10px;
                    transition: all 0.2s;
                " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                    🖼️ Скачать PNG
                </button>
            </div>
        </div>
    </div>
</div>
`;
    }

    /**
     * Проверить, добавлен ли блок статистики
     * @returns {boolean}
     */
    isStatsBlockAdded() {
        return document.querySelector('.user-anime-stats-block') !== null;
    }

    /**
     * Найти точку вставки (блок с заголовком "Аниме пользователя")
     * @returns {HTMLElement|null}
     */
    findInsertionPoint() {
        // Ищем блок с заголовком "Аниме пользователя"
        const mailBlock = document.querySelector('.mailBlock_h');
        return mailBlock;
    }

    /**
     * Получить текст статистики для шаринга
     * @param {object} stats
     * @returns {string}
     */
    getShareText(stats) {
        const username = this.getUsernameFromUrl();
        return `📊 Статистика ${username} на Jut.su

🎬 Просмотрено аниме: ${stats.totalAnime}
📺 Серий: ${stats.totalSeries}
🎞️ Фильмов: ${stats.totalMovies}
⭐ Средняя оценка: ${stats.averageRating}/5.0
⏱️ Время просмотра: ${stats.totalTimeHours} ч (≈${stats.totalTimeDays} дн)

jutsu.fun`;
    }

    /**
     * Переключение меню "Поделиться"
     */
    toggleShareMenu() {
        const menu = document.getElementById('shareStatsMenu');
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Копировать статистику в буфер обмена
     * @param {object} stats
     */
    copyStats(stats) {
        const username = this.getUsernameFromUrl();
        const text = `📊 Моя статистика на Jut.su\n\n` +
                     `👤 Пользователь: ${username}\n` +
                     `📺 Просмотрено аниме: ${stats.totalAnime}\n` +
                     `🎬 Всего серий: ${stats.totalSeries}\n` +
                     `🎞️ Фильмов: ${stats.totalMovies}\n` +
                     `⭐ Средняя оценка: ${stats.averageRating}/5\n` +
                     `⏱️ Время просмотра: ${stats.totalTimeHours} часов (≈${stats.totalTimeDays} дней)\n\n` +
                     `🌐 ${window.location.href}`;

        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('copyStatsBtn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✅ Скопировано!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            }
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            alert('Не удалось скопировать текст');
        });
    }

    /**
     * Поделиться в Telegram
     * @param {object} stats
     */
    shareToTelegram(stats) {
        const text = this.getShareText(stats);
        const url = `https://t.me/share/url?url=${encodeURIComponent("jutsu.fun")}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    /**
     * Поделиться в VK
     * @param {object} stats
     */
    shareToVK(stats) {
        const text = this.getShareText(stats);
        const url = `https://vk.com/share.php?url=${encodeURIComponent("https://jutsu.fun")}&title=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'width=600,height=400');
    }

    /**
     * Поделиться в Twitter
     * @param {object} stats
     */
    shareToTwitter(stats) {
        const text = this.getShareText(stats);
        const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'width=600,height=400');
    }

    /**
     * Скачать статистику в TXT
     * @param {object} stats
     */
    downloadStats(stats) {
        const username = this.getUsernameFromUrl();
        const text = `=================================\n` +
                     `  СТАТИСТИКА НА JUT.SU\n` +
                     `=================================\n\n` +
                     `Пользователь: ${username}\n` +
                     `Дата: ${new Date().toLocaleDateString('ru-RU')}\n\n` +
                     `📺 Просмотрено аниме: ${stats.totalAnime}\n` +
                     `🎬 Всего серий: ${stats.totalSeries}\n` +
                     `🎞️ Фильмов: ${stats.totalMovies}\n` +
                     `⭐ Средняя оценка: ${stats.averageRating}/5\n\n` +
                     `⏱️ Время просмотра:\n` +
                     `   ${stats.totalTimeHours} часов\n` +
                     `   ≈ ${stats.totalTimeDays} дней\n\n` +
                     `🌐 Ссылка: ${window.location.href}\n\n` +
                     `=================================\n` +
                     `Создано с помощью Jut.su Extended (jutsu.fun)\n` +
                     `=================================`;

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `jutsu_stats_${username}_${Date.now()}.txt`;
        link.click();
    }

    /**
     * Скачать статистику как изображение PNG
     * @param {object} stats
     */
    downloadStatsImage(stats) {
        const username = this.getUsernameFromUrl();
        const isDark = this.isDarkMode();
        
        // Создаём canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        // Цвета в зависимости от темы
        const colors = isDark ? {
            bg: '#363a37',
            text: '#cdcdd3',
            accent: '#7b8254',
            highlight: '#adbd5b',
            border: '#666d43'
        } : {
            bg: '#eef5cd',
            text: '#333',
            accent: '#5a6340',
            highlight: '#6a7a2b',
            border: '#bddc62'
        };

        // Заполняем фон
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Рамка
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Заголовок
        ctx.fillStyle = colors.accent;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📊 Статистика на Jut.su', canvas.width / 2, 70);

        // Пользователь
        ctx.font = '24px Arial';
        ctx.fillStyle = colors.text;
        ctx.fillText(`Пользователь: ${username}`, canvas.width / 2, 120);

        // Линия
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, 150);
        ctx.lineTo(700, 150);
        ctx.stroke();

        // Основная статистика
        const statsData = [
            { label: 'АНИМЕ', value: stats.totalAnime, y: 210 },
            { label: 'СЕРИЙ', value: stats.totalSeries, y: 280 },
            { label: 'ФИЛЬМОВ', value: stats.totalMovies, y: 350 },
            { label: 'СР. ОЦЕНКА', value: `${stats.averageRating} ★`, y: 420 }
        ];

        statsData.forEach(item => {
            ctx.font = '18px Arial';
            ctx.fillStyle = colors.accent;
            ctx.textAlign = 'left';
            ctx.fillText(item.label, 150, item.y);

            ctx.font = 'bold 32px Arial';
            ctx.fillStyle = colors.highlight;
            ctx.textAlign = 'right';
            ctx.fillText(String(item.value), 650, item.y);
        });

        // Время просмотра
        ctx.font = '18px Arial';
        ctx.fillStyle = colors.accent;
        ctx.textAlign = 'center';
        ctx.fillText('⏱️ ВРЕМЯ ПРОСМОТРА', canvas.width / 2, 490);

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = colors.highlight;
        ctx.fillText(`${stats.totalTimeHours} часов ≈ ${stats.totalTimeDays} дней`, canvas.width / 2, 530);

        // Подпись
        ctx.font = '14px Arial';
        ctx.fillStyle = colors.accent;
        ctx.fillText('Создано с помощью Jut.su Extended (jutsu.fun)', canvas.width / 2, 570);

        // Скачивание
        canvas.toBlob(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `jutsu_stats_${username}_${Date.now()}.png`;
            link.click();
        });
    }

    /**
     * Загрузить все аниме автоматически
     */
    loadAllAnime() {
        const button = document.getElementById('loadAllAnimeBtn');
        if (!button) return;

        // Меняем текст кнопки
        const originalText = button.textContent;
        button.textContent = '⏳ Загрузка...';
        button.disabled = true;
        button.style.cursor = 'wait';

        let loadedCount = 0;
        const interval = setInterval(() => {
            // Ищем кнопку "Загрузить ещё"
            const loadMoreBtn = document.querySelector('.load_more_anime');
            
            if (loadMoreBtn && window.getComputedStyle(loadMoreBtn).display !== 'none') {
                // Кнопка видна - нажимаем
                loadMoreBtn.click();
                loadedCount++;
                button.textContent = `⏳ Загружено блоков: ${loadedCount}`;
            } else {
                // Кнопка скрыта или не найдена - завершаем
                clearInterval(interval);
                button.textContent = `✅ Загружено!`;
                
                // Возвращаем кнопку в исходное состояние через 2 секунды
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                    button.style.cursor = 'pointer';
                    
                    // Автоматически обновляем статистику
                    this.refreshStats();
                }, 2000);
            }
        }, 500); // Задержка между запросами 500ms
    }

    /**
     * Вставить блок статистики
     * @returns {boolean}
     */
    insertStatsBlock() {
        if (!this.isUserAnimePage()) {
            return false;
        }

        if (this.isStatsBlockAdded()) {
            return true;
        }

        const insertPoint = this.findInsertionPoint();
        if (!insertPoint) {
            console.warn('[UserAnimePage] Точка вставки не найдена');
            return false;
        }

        // Собираем статистику
        const stats = this.collectStatistics();
        
        // Создаём HTML
        const statsHTML = this.createStatsHTML(stats);
        
        // Вставляем после заголовка
        insertPoint.insertAdjacentHTML('afterend', statsHTML);

        // Добавляем обработчики ПОСЛЕ вставки HTML в DOM
        this.attachEventHandlers(stats);

        // Настраиваем наблюдатель за темой
        this.setupThemeObserver();

        console.log('[UserAnimePage] Статистика добавлена:', stats);
        return true;
    }

    /**
     * Добавить обработчики событий на кнопки
     * @param {object} currentStats - текущая статистика
     */
    attachEventHandlers(currentStats) {
        // Кнопка "Загрузить все"
        const loadAllBtn = document.getElementById('loadAllAnimeBtn');
        if (loadAllBtn) {
            loadAllBtn.addEventListener('click', () => {
                this.loadAllAnime();
            });
        }

        // Кнопка "Обновить"
        const refreshBtn = document.getElementById('refreshAnimeStats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshStats();
            });
        }

        // Кнопка "Поделиться" - переключение меню
        const shareBtn = document.getElementById('shareStatsBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.toggleShareMenu();
            });
        }

        // Кнопка "Копировать текст"
        const copyBtn = document.getElementById('copyStatsBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const freshStats = this.collectStatistics();
                this.copyStats(freshStats);
            });
        }

        // Кнопка "Telegram"
        const telegramBtn = document.getElementById('shareTelegramBtn');
        if (telegramBtn) {
            telegramBtn.addEventListener('click', () => {
                const freshStats = this.collectStatistics();
                this.shareToTelegram(freshStats);
            });
        }

        // Кнопка "VK"
        const vkBtn = document.getElementById('shareVKBtn');
        if (vkBtn) {
            vkBtn.addEventListener('click', () => {
                const freshStats = this.collectStatistics();
                this.shareToVK(freshStats);
            });
        }

        // Кнопка "Twitter"
        const twitterBtn = document.getElementById('shareTwitterBtn');
        if (twitterBtn) {
            twitterBtn.addEventListener('click', () => {
                const freshStats = this.collectStatistics();
                this.shareToTwitter(freshStats);
            });
        }

        // Кнопка "Скачать TXT"
        const downloadBtn = document.getElementById('downloadStatsBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const freshStats = this.collectStatistics();
                this.downloadStats(freshStats);
            });
        }

        // Кнопка "Скачать PNG"
        const downloadImageBtn = document.getElementById('downloadImageBtn');
        if (downloadImageBtn) {
            downloadImageBtn.addEventListener('click', () => {
                const freshStats = this.collectStatistics();
                this.downloadStatsImage(freshStats);
            });
        }
    }

    /**
     * Обновить статистику (пересчитать и перерисовать)
     */
    refreshStats() {
        const statsBlock = document.querySelector('.user-anime-stats-block');
        if (statsBlock) {
            statsBlock.remove();
        }
        
        // Отключаем observer перед пересозданием
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
        
        // Пересоздаём блок
        this.insertStatsBlock();
    }

    /**
     * Удалить блок статистики
     * @static
     */
    static remove() {
        const element = document.querySelector('.user-anime-stats-block');
        if (element) {
            element.remove();
            console.log('[UserAnimePage] Статистика удалена');
        }
    }

    /**
     * Инициализация с ожиданием загрузки DOM
     * @static
     */
    static async init() {
        // Получаем настройки (если они есть)
        let settings = { enableUserAnimePage: true };
        
        if (typeof SettingsStorage !== 'undefined') {
            settings = await SettingsStorage.getSettings();
        }
        
        // Проверяем, включена ли функция
        if (!settings.enableUserAnimePage) {
            console.log('[UserAnimePage] Функция отключена в настройках');
            return;
        }

        const page = new UserAnimePage();
        
        // Проверяем, нужно ли что-то делать
        if (!page.isUserAnimePage()) {
            return;
        }

        console.log('[UserAnimePage] Инициализация...');

        // Ждём загрузки контента
        const waitForContent = () => {
            const animeBlocks = document.querySelectorAll('.all_anime_global.this_anime_is_viewed');
            if (animeBlocks.length > 0) {
                page.insertStatsBlock();
            } else {
                setTimeout(waitForContent, 500);
            }
        };

        // Если DOM уже загружен
        if (document.readyState === 'complete') {
            waitForContent();
        } else {
            window.addEventListener('load', waitForContent);
        }
    }
}

// Экспортируем в глобальную область
window.UserAnimePage = UserAnimePage;

// Автоматический запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UserAnimePage.init();
    });
} else {
    UserAnimePage.init();
}