
// ============================================================
// ФАЙЛ: src/achievementsParser.js
// ============================================================

/**
 * Парсинг достижений из window.some_achiv_str
 */
function parseAchievements() {
    try {
        let achievements = [];

        if (typeof window.some_achiv_str === 'undefined') {
            return achievements;
        }

        const decoded = atob(window.some_achiv_str);
        const achievementsRegex = /this_anime_achievements\.push\(\s*({[\s\S]*?})\s*\);/g;
        let match;

        while ((match = achievementsRegex.exec(decoded)) !== null) {
            let jsonString = match[1];
            jsonString = jsonString.replace(/(js_preres_url \+ "(.*?)")/g, '"$2"');
            jsonString = jsonString.replace(/[\r\n]/g, '').trim();
            achievements.push(eval('(' + jsonString + ')'));
        }

        achievements.forEach(achievement => {
            achievement.title = decodeString(achievement.title);
            achievement.description = decodeString(achievement.description);
        });

        return achievements;

    } catch (error) {
        //console.error('Ошибка при парсинге достижений:', error);
        return [];
    }
}

/**
 * Подсчет количества достижений без полного парсинга
 */
function countAchievements() {
    try {
        if (typeof window.some_achiv_str === 'undefined') {
            return 0;
        }

        const decoded = atob(window.some_achiv_str);
        const achievementsRegex = /this_anime_achievements\.push\(\s*({[\s\S]*?})\s*\);/g;
        let count = 0;

        while (achievementsRegex.exec(decoded) !== null) {
            count++;
        }

        return count;

    } catch (error) {
        //console.error('Ошибка при подсчете достижений:', error);
        return 0;
    }
}

/**
 * Ожидание загрузки данных достижений
 */
function waitForAchievementsData(callback, interval = 100) {
    const checkInterval = setInterval(() => {
        if (typeof window.some_achiv_str !== 'undefined') {
            clearInterval(checkInterval);
            callback();
        }
    }, interval);
    return checkInterval;
}

