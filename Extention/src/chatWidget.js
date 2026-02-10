// ============================================================
// ФАЙЛ: src/chatWidget.js (ИСПРАВЛЕННАЯ ВЕРСИЯ)
// ============================================================

class ChatWidget {
    constructor() {
        this.chatWrapper = null;
        this.chatIframe = null;
        this.chatUrl = '/minichat/';
        this.themeObserver = null;
    }

    isDarkMode() {
        return document.body.classList.contains('dark_mode');
    }

    getThemeStyles() {
        const isDark = this.isDarkMode();
        
        if (isDark) {
            return {
                background: '#363a37',
                boxShadow: '2px 2px 3px #535f53, inset 1px 1px 1px #535f53',
                color: '#cdcdd3'
            };
        } else {
            return {
                background: '#eef5cd',
                boxShadow: '2px 2px 3px #bddc62, inset 1px 1px 1px #bddc62',
                color: '#333'
            };
        }
    }

    // Внедрить стили в iframe
    injectStylesToIframe() {
        try {
            const iframeDoc = this.chatIframe.contentDocument || this.chatIframe.contentWindow.document;
            const iframeWindow = this.chatIframe.contentWindow;
            
            // ===================================
            // ФИКС 1: Правильная обработка ссылок и кнопок
            // ===================================
            iframeDoc.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                const button = e.target.closest('button, input[type="button"], .button');
                
                if (link) {
                    const href = link.getAttribute('href');
                    const hasOnclick = link.hasAttribute('onclick') || link.onclick;
                    
                    // Если у ссылки есть onclick и href="#" - только блокируем переход
                    if ((href === '#' || href === 'https://jut.su/minichat/#' || href?.endsWith('/minichat/#')) && hasOnclick) {
                        e.preventDefault();
                        // Даём onclick выполниться
                        return;
                    }
                    
                    // Если href="#" без onclick - блокируем полностью
                    if (href === '#' || href === 'https://jut.su/minichat/#' || href?.endsWith('/minichat/#')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                    
                    // Для внешних ссылок - открываем в родителе
                    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
                        e.preventDefault();
                        window.open(href, '_parent');
                    }
                }
                
                // Для кнопок в модальных окнах - даём им работать нормально
                if (button && button.closest('.ui-dialog')) {
                    // Кнопки в модалках работают как обычно
                    return;
                }
            }, false); // Используем фазу всплытия вместо capture
            
            // ===================================
            // ФИКС 2: Автоуменьшение модалок + ЭМОДЗИ
            // ===================================
            
            // Перехватываем все функции открытия модалок
            const originalIchatRules = iframeWindow.iChatRules;
            const originalIchatHistory = iframeWindow.iChatHistory;
            const originalIchatInsEmo = iframeWindow.iChat_ins_emo;
            
            // Правила чата
            if (typeof originalIchatRules === 'function') {
                iframeWindow.iChatRules = () => {
                    originalIchatRules();
                    setTimeout(() => this.fixModalSize(iframeDoc), 100);
                    return false;
                };
            }
            
            // Архив чата
            if (typeof originalIchatHistory === 'function') {
                iframeWindow.iChatHistory = () => {
                    originalIchatHistory();
                    setTimeout(() => this.fixModalSize(iframeDoc), 100);
                    return false;
                };
            }
            
            // ===================================
            // ИСПРАВЛЕНИЕ: Смайлики теперь работают!
            // ===================================
            if (typeof originalIchatInsEmo === 'function') {
                iframeWindow.iChat_ins_emo = function(elem) {
                    // Вызываем оригинальную функцию с правильным контекстом
                    const result = originalIchatInsEmo.call(iframeWindow, elem);
                    
                    // Исправляем размер модалки после открытия
                    setTimeout(() => {
                        const chatWidget = window.parent.document.querySelector('#jutsu-extended-chat');
                        if (chatWidget) {
                            const instance = chatWidget.__chatWidgetInstance;
                            if (instance) {
                                instance.fixModalSize(iframeDoc);
                            }
                        }
                    }, 100);
                    
                    return result;
                };
            }
            
            // Создаём стили
            const style = iframeDoc.createElement('style');
            style.textContent = `
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                }
                
                body {
                    height: auto !important;
                    min-height: 100% !important;
                }
                
                /* Контейнер для сообщений */
                #iChat-style {
                    height: 300px !important;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    margin-bottom: 10px !important;
                }
                
                /* Красивый скроллбар */
                #iChat-style::-webkit-scrollbar {
                    width: 8px;
                }
                
                #iChat-style::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 4px;
                }
                
                #iChat-style::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                }
                
                #iChat-style::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.5);
                }
                
                .iChat_editor {
                    position: relative !important;
                    background: transparent !important;
                    padding: 10px 0 !important;
                    margin-top: 10px !important;
                }
                
                textarea[name="message"] {
                    width: 100% !important;
                    min-height: 60px !important;
                    max-height: 60px !important;
                    resize: none !important;
                    box-sizing: border-box !important;
                    border: 1px solid #555 !important;
                    border-radius: 5px !important;
                    padding: 8px !important;
                    font-family: verdana, sans-serif !important;
                }
                
                .iChat_editor + div {
                    padding: 10px 0 !important;
                }
                
                .iChat {
                    overflow-x: hidden !important;
                }
                
                .message {
                    margin-bottom: 10px !important;
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    max-width: 100% !important;
                }
                
                .text {
                    max-width: 100% !important;
                    overflow-wrap: break-word !important;
                    word-break: break-word !important;
                }
                
                .text img, .message img {
                    max-width: 100% !important;
                    height: auto !important;
                }
                
                .avatar img {
                    max-width: 32px !important;
                    height: auto !important;
                }
                
                .button, input[type="button"] {
                    padding: 5px 10px !important;
                    border-radius: 5px !important;
                    cursor: pointer !important;
                }
                
                /* ===================================
                   ИСПРАВЛЕНИЕ: Модальные окна 90% ширины
                   =================================== */
                .ui-dialog {
                    width: 90% !important;
                    max-width: 90% !important;
                    max-height: 80vh !important;
                    left: 5% !important;
                    top: 20px !important;
                    right: auto !important;
                    bottom: auto !important;
                    position: fixed !important;
                }
                
                .ui-dialog-content {
                    max-height: calc(80vh - 60px) !important;
                    overflow: auto !important;
                    width: 100% !important;
                }
                
                .ui-dialog-titlebar {
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                /* Скроллбар для модалок */
                .ui-dialog-content::-webkit-scrollbar {
                    width: 6px;
                }
                
                .ui-dialog-content::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                
                .ui-dialog-content::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 3px;
                }
                
                /* Эмодзи в модалке */
                .ui-dialog-content img {
                    max-width: 24px !important;
                    height: auto !important;
                    cursor: pointer !important;
                    margin: 2px !important;
                }
            `;
            
            iframeDoc.head.appendChild(style);
            
            // Наблюдаем за добавлением модалок
            this.observeModals(iframeDoc);
            
        } catch (error) {
            //console.error('[ChatWidget] Ошибка при внедрении стилей:', error);
        }
    }

    // ===================================
    // ИСПРАВЛЕНИЕ: Модалки 90% ширины
    // ===================================
    fixModalSize(iframeDoc) {
        const modals = iframeDoc.querySelectorAll('.ui-dialog');
        
        modals.forEach(modal => {
            // Устанавливаем 90% ширины
            modal.style.width = '90%';
            modal.style.maxWidth = '90%';
            modal.style.maxHeight = '80vh';
            modal.style.left = '5%';
            modal.style.top = '20px';
            modal.style.right = 'auto';
            modal.style.bottom = 'auto';
            modal.style.position = 'fixed';
            
            // Добавляем скролл к контенту
            const content = modal.querySelector('.ui-dialog-content');
            if (content) {
                content.style.maxHeight = 'calc(80vh - 60px)';
                content.style.overflow = 'auto';
                content.style.width = '100%';
            }
            
            // Исправляем заголовок
            const titlebar = modal.querySelector('.ui-dialog-titlebar');
            if (titlebar) {
                titlebar.style.width = '100%';
                titlebar.style.boxSizing = 'border-box';
            }
        });
    }

    // Наблюдаем за появлением новых модалок
    observeModals(iframeDoc) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList?.contains('ui-dialog')) {
                        this.fixModalSize(iframeDoc);
                    }
                });
            });
        });
        
        observer.observe(iframeDoc.body, {
            childList: true,
            subtree: true
        });
    }

    // Создать виджет чата
    createChatWidget() {
        const themeStyles = this.getThemeStyles();
        
        this.chatWrapper = document.createElement('div');
        this.chatWrapper.className = 'widget';
        this.chatWrapper.id = 'jutsu-extended-chat';
        this.chatWrapper.__chatWidgetInstance = this; // Сохраняем ссылку на экземпляр
        this.chatWrapper.style.cssText = `
            font: 12px/1.5 verdana, sans-serif;
            color: ${themeStyles.color};
            background: ${themeStyles.background};
            border-radius: 10px;
            box-shadow: ${themeStyles.boxShadow};
            padding: 10px;
            margin: 0 0 25px;
            text-align: center;
        `;
        
        const title = document.createElement('div');
        title.className = 'b-b-g-title';
        title.innerHTML = 'Чат <span>сообщества</span>';
        title.style.marginBottom = '10px';
        
        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
            width: 100%;
            height: 500px;
            overflow: hidden;
            border-radius: 10px;
            margin-bottom: 10px;
            position: relative;
            background: white;
        `;
        
        this.chatIframe = document.createElement('iframe');
        this.chatIframe.id = 'miniChat';
        this.chatIframe.src = this.chatUrl;
        this.chatIframe.scrolling = 'no';
        this.chatIframe.setAttribute('frameborder', '0');
        this.chatIframe.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 10px;
            border: none;
            display: block;
            position: absolute;
            top: 0;
            left: 0;
        `;
        
        this.chatIframe.addEventListener('load', () => {
            setTimeout(() => {
                this.injectStylesToIframe();
            }, 100);
        }, { once: true });
        
        iframeContainer.appendChild(this.chatIframe);
        
        const refreshBtn = document.createElement('button');
        refreshBtn.innerText = '🔄 Обновить чат';
        refreshBtn.style.cssText = `
            width: 100%;
            padding: 8px 15px;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            background-color: rgb(83, 95, 83);
            color: white;
            font-size: 12px;
            font-weight: 600;
            transition: background-color 0.2s ease;
            font-family: verdana, sans-serif;
        `;
        
        refreshBtn.onmouseover = () => {
            refreshBtn.style.backgroundColor = 'rgb(103, 115, 103)';
        };
        
        refreshBtn.onmouseout = () => {
            refreshBtn.style.backgroundColor = 'rgb(83, 95, 83)';
        };
        
        refreshBtn.onclick = () => {
            // Перезагружаем iframe и заново инжектим стили
            this.chatIframe.contentWindow.location.reload();
            
            // Ждём загрузки и инжектим стили снова
            const reloadHandler = () => {
                setTimeout(() => {
                    this.injectStylesToIframe();
                }, 100);
            };
            
            this.chatIframe.addEventListener('load', reloadHandler, { once: true });
        };
        
        this.chatWrapper.appendChild(title);
        this.chatWrapper.appendChild(iframeContainer);
        this.chatWrapper.appendChild(refreshBtn);
        
        this.setupThemeObserver();
        
        return this.chatWrapper;
    }

    setupThemeObserver() {
        if (this.themeObserver) {
            return;
        }
        
        this.themeObserver = new MutationObserver(() => {
            if (this.chatWrapper) {
                const themeStyles = this.getThemeStyles();
                this.chatWrapper.style.background = themeStyles.background;
                this.chatWrapper.style.boxShadow = themeStyles.boxShadow;
                this.chatWrapper.style.color = themeStyles.color;
            }
        });
        
        this.themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    findSidebar() {
        return document.querySelector('.sidebar');
    }

    insertIntoSidebar() {
        const sidebar = this.findSidebar();
        
        if (!sidebar) {
            return false;
        }

        const navWidget = sidebar.querySelector('.widget');
        
        if (!navWidget) {
            return false;
        }

        const chatWidget = this.createChatWidget();
        navWidget.insertAdjacentElement('afterend', chatWidget);
        
        return true;
    }

    remove() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
        
        const existingChat = document.getElementById('jutsu-extended-chat');
        if (existingChat) {
            existingChat.remove();
        }
        
        this.chatWrapper = null;
        this.chatIframe = null;
    }

    static exists() {
        return document.getElementById('jutsu-extended-chat') !== null;
    }

    static async init() {
        const settings = await SettingsStorage.getSettings();
        const showChat = settings.showChat !== undefined ? settings.showChat : true;
        
        if (!showChat) {
            return;
        }

        if (ChatWidget.exists()) {
            return;
        }

        const chatWidget = new ChatWidget();
        const inserted = chatWidget.insertIntoSidebar();
        
        if (!inserted) {
            waitForElement('.sidebar', () => {
                if (!ChatWidget.exists()) {
                    const newChatWidget = new ChatWidget();
                    newChatWidget.insertIntoSidebar();
                }
            });
        }
    }

    static toggle(show) {
        if (show) {
            if (!ChatWidget.exists()) {
                const chatWidget = new ChatWidget();
                const inserted = chatWidget.insertIntoSidebar();
                
                if (!inserted) {
                    waitForElement('.sidebar', () => {
                        if (!ChatWidget.exists()) {
                            const newChatWidget = new ChatWidget();
                            newChatWidget.insertIntoSidebar();
                        }
                    });
                }
            }
        } else {
            const existingChat = document.getElementById('jutsu-extended-chat');
            if (existingChat) {
                existingChat.remove();
            }
        }
    }
}

window.ChatWidget = ChatWidget;