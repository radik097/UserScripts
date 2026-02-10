

// ============================================================
// ФАЙЛ: src/utils.js
// ============================================================

/**
 * Форматирование времени в часы, минуты и секунды
 */
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return { hours, minutes, seconds: remainingSeconds };
}

/**
 * Декодирование строки из UTF-8
 */
function decodeString(str) {
    const bytes = new Uint8Array(str.split('').map(char => char.charCodeAt(0)));
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
}

/**
 * Проверка, заблокирован ли текущий путь
 */
function isPathBlocked(blockedPaths) {
    
    return false; // заглушка блокировать сейчас не надо
    if (window.location.pathname === '/') {
        return true;
    }

    for (const path of blockedPaths) {
        if (window.location.href.match(path)) {
            return true;
        }
    }

}

/**
 * Ожидание появления элемента в DOM
 */

// НОВАЯ ВЕРСИЯ (ВСТАВИТЬ):
function waitForElement(selector, callback, timeout = 5000) {
    const startTime = Date.now();
    
    const check = () => {
        const element = document.querySelector(selector);
        
        if (element) {
            callback(element);
            return;
        }
        
        if (Date.now() - startTime > timeout) {
            //console.warn(`[waitForElement] Таймаут для селектора: ${selector}`);
            return;
        }
        
        requestAnimationFrame(check);
    };
    
    check();
}