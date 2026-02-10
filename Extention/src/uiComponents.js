
// ============================================================
// ФАЙЛ: src/uiComponents.js
// ============================================================

/**
 * Создание кнопки поддержки
 */
function createSupportButton(colors, supportLink) {
    const supportButton = document.createElement('div');
    supportButton.style.cssText = `
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid ${colors.support.border};
        text-align: center;
    `;
    supportButton.innerHTML = `
        <button class="support-link" style="display: inline-block; padding: 10px 20px; background: ${colors.support.background}; color: ${colors.support.text}; text-decoration: none; border-radius: 5px; font-size: 14px; font-family: ${colors.fonts.button}; font-weight: bold; transition: background 0.3s; border: none; cursor: pointer;">
            ❤️ Нажмите, чтобы поддержать автора
        </button>
    `;

    const supportLinkEl = supportButton.querySelector('.support-link');
    supportLinkEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(supportLink, '_blank', 'noopener,noreferrer');
    });

    supportLinkEl.addEventListener('mouseenter', () => {
        supportLinkEl.style.background = colors.support.backgroundHover;
    });
    supportLinkEl.addEventListener('mouseleave', () => {
        supportLinkEl.style.background = colors.support.background;
    });

    return supportButton;
}

/**
 * Создание заголовка панели
 */
function createPanelHeader(colors, closeCallback) {
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';
    header.innerHTML = `
        <h2 style="margin: 0; color: ${colors.header.text}; font-family: ${colors.fonts.main};">${colors.button.icon} Достижения</h2>
        <button class="close-panel-btn" style="background: ${colors.header.closeButton}; color: ${colors.header.closeButtonText}; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px; transition: background 0.3s;">✕</button>
    `;

    const closeBtn = header.querySelector('.close-panel-btn');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeCallback();
    });
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = colors.header.closeButtonHover;
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = colors.header.closeButton;
    });

    return header;
}

/**
 * Создание оверлея
 */
function createOverlay(colors, closeCallback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${colors.modal.overlay};
        display: none;
        z-index: 9999;
    `;
    overlay.addEventListener('click', closeCallback);
    return overlay;
}

/**
 * Создание модальной панели
 */
function createModalPanel(colors) {
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        background: ${colors.modal.background};
        border: 2px solid ${colors.modal.border};
        border-radius: 10px;
        box-shadow: 0 4px 20px ${colors.modal.shadow};
        padding: 20px;
        display: none;
        z-index: 10000;
    `;

    panel.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    return panel;
}

/**
 * Создание кнопки достижений
 */
function createAchievementsButton(colors) {
    const btn = document.createElement('a');
    btn.href = '#';
    btn.innerHTML = `${colors.button.icon} Достижения`;
    btn.className = 'short-btn black video vncenter the_hildi achievements-btn';
    btn.style.cssText = `
        cursor: pointer;
        margin-top: 10px !important;
        margin-left: 0 !important;
        margin-right: 4px !important;
    `;

    btn.addEventListener('mouseenter', () => {
        btn.style.background = colors.button.backgroundHover + ' !important';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.background = colors.button.background + ' !important';
    });

    return btn;
}

/**
 * Обновление текста кнопки с количеством достижений
 */
function updateButtonText(button, colors, count) {
    if (count > 0) {
        button.innerHTML = `${colors.button.icon} Достижения (${count})`;
    }
}

