// ============================================================
// ФАЙЛ: src/videoTracker.js (MAIN WORLD)
// Отслеживание видео и отправка данных через мост
// ============================================================

class VideoTracker {
    constructor() {
        this.isTracking = false;
        this.lastSentUrl = null;
        this.checkInterval = null;
        this.requestId = 0;
        this.userAgentSet = false;
    }

    /**
     * Инициализация трекера
     */
    async init() {
        const settings = await SettingsStorage.getSettings();
        
        if (!settings.enableServerConnection) {
            //console.log('[VideoTracker] Отправка данных на сервер отключена');
            return;
        }

        if (!this.isVideoPage()) {
            return;
        }

        //console.log('[VideoTracker] 🎬 Инициализация на странице видео');
        
        // Проверяем работоспособность background worker
        await this.checkBackgroundWorker();
        
        this.startTracking();
        this.observeUrlChanges();
    }

    /**
     * Проверить работоспособность background worker
     */
    async checkBackgroundWorker() {
        try {
            const response = await this.sendToBackground('PING', {});
            
            if (response.success) {
                //console.log('[VideoTracker] ✅ Background worker работает');
            }
        } catch (error) {
            //console.error('[VideoTracker] ❌ Background worker недоступен:', error);
        }
    }

    /**
     * Проверяет, является ли текущая страница страницей с видео
     */
    isVideoPage() {
        const path = window.location.pathname;
        const videoPagePattern = /^\/[^\/]+\/(episode-\d+|season-\d+\/episode-\d+|film-\d+)\.html$/;
        return videoPagePattern.test(path);
    }

    /**
     * Начать отслеживание видео
     */
    startTracking() {
        if (this.isTracking) return;
        
        this.isTracking = true;
        this.userAgentSet = false;
        
        // Проверяем видео сразу
        this.checkVideo();
        
        // Проверяем видео каждые 2 секунды
        this.checkInterval = setInterval(() => {
            this.checkVideo();
        }, 2000);
    }

    /**
     * Остановить отслеживание
     */
    stopTracking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isTracking = false;
    }

    /**
     * Проверить наличие видео и отправить данные
     */
    async checkVideo() {
        const videoElement = document.querySelector('video#my-player_html5_api.vjs-tech');
        
        if (!videoElement) return;

        const sources = videoElement.querySelectorAll('source');
        if (sources.length === 0) return;

        const currentUrl = window.location.href;
        if (this.lastSentUrl === currentUrl) return;

        // Проверяем, есть ли реальные MP4 источники
        if (this.hasRealVideoSources(sources)) {
            // Есть .mp4 → отправляем на сервер (существующая логика)
            const videoData = await this.collectVideoData(videoElement, sources);
            
            if (!videoData) {
                //console.log('[VideoTracker] ⚠️ Нет данных для отправки');
                return;
            }
            
            //console.log('[VideoTracker] 📊 Собраны данные о видео:', videoData);

            const response = await this.sendToBackground('SEND_VIDEO_DATA', videoData);
            
            if (response.success) {
                this.lastSentUrl = currentUrl;
                //console.log('[VideoTracker] ✅ Данные успешно отправлены на сервер');
                this.stopTracking();
            } else {
                //console.error('[VideoTracker] ❌ Ошибка отправки:', response.error);
            }
        } else {
            // НЕТ .mp4 → запрашиваем источники с сервера
            //console.log('[VideoTracker] 🔍 Реальных видео нет, запрашиваем с сервера...');
            await this.requestVideoSourcesFromServer(videoElement);
        }
    }

    /**
     * Проверить, есть ли реальные MP4 источники
     */
    hasRealVideoSources(sources) {
        for (let source of sources) {
            const src = source.getAttribute('src');
            if (src && src.includes('.mp4')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Запросить видео-источники с сервера и заменить в плеере
     */
    async requestVideoSourcesFromServer(videoElement) {
        // КРИТИЧНО: Получаем куки пользователя для регистрации и проверки лимита
        const cookies = await this.getCookies();
        
        const metadata = {
            pageUrl: window.location.href,
            pathname: window.location.pathname,
            animeName: this.extractAnimeName(),
            episodeInfo: this.extractEpisodeInfo(),
            cookies: cookies  // ✅ ДОБАВЛЕНО: отправляем куки
        };

        //console.log('[VideoTracker] 📤 Запрос источников с сервера:', metadata);

        try {
            const response = await this.sendToBackground('GET_VIDEO_SOURCES', metadata);
            
            //console.log('[VideoTracker] 📥 Ответ сервера:', response);
            
            if (!response.success && response.error?.includes('Extension context invalidated')) {
                //console.warn('[VideoTracker] 🔄 Расширение перезагружено');
                setTimeout(() => window.location.reload(), 2000);
                return;
            }
            
            // ✅ ДОБАВЛЕНО: Обработка ошибки 429 (лимит запросов)
            if (!response.success && response.error?.includes('429')) {
                //console.error('[VideoTracker] ⛔ Превышен дневной лимит запросов (100/день)');
                this.showRateLimitError();
                this.stopTracking();
                return;
            }
            
            const sources = response.data?.sources;
            const userAgent = response.data?.userAgent;
            
            if (response.success && sources && Array.isArray(sources) && sources.length > 0) {
                //console.log('[VideoTracker] ✅ Получены источники:', sources);
                //console.log('[VideoTracker] 🔧 User-Agent донора:', userAgent);
                
                // КРИТИЧНО: Сначала устанавливаем User-Agent
                if (userAgent && !this.userAgentSet) {
                    await this.setUserAgent(userAgent, sources);
                    this.userAgentSet = true;
                    
                    // Даем время на установку правил в браузере (увеличено до 1 секунды)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    //console.log('[VideoTracker] ⏳ User-Agent должен быть активен');
                }
                
                this.replaceJutsuPlusBlock(sources);
                
                this.lastSentUrl = window.location.href;
                this.stopTracking();
            } else {
                //console.warn('[VideoTracker] ⚠️ Источники отсутствуют');
                this.showNoSourcesAvailable();
                this.stopTracking();
            }
        } catch (error) {
            //console.error('[VideoTracker] ❌ Ошибка:', error);
            this.showNoSourcesAvailable();
            this.stopTracking();
        }
    }

    /**
     * Установить User-Agent через background
     */
    async setUserAgent(userAgent, sources) {
        //console.log('[VideoTracker] 🔧 Установка User-Agent:', userAgent);
        
        const videoUrls = sources.map(s => s.url);
        
        try {
            const response = await this.sendToBackground('SET_USER_AGENT', {
                userAgent: userAgent,
                videoUrls: videoUrls
            });
            
            if (response.success) {
                //console.log('[VideoTracker] ✅ User-Agent установлен успешно');
            } else {
                //console.error('[VideoTracker] ❌ Ошибка установки User-Agent:', response.error);
            }
        } catch (error) {
            //console.error('[VideoTracker] ❌ Ошибка установки User-Agent:', error);
        }
    }

    /**
     * ✅ ДОБАВЛЕНО: Показать сообщение о превышении лимита
     */
    showRateLimitError() {
        const jutsuPlusBlock = document.querySelector('.tab_need_plus');
        
        if (!jutsuPlusBlock) {
            //console.log('[VideoTracker] ⚠️ Блок .tab_need_plus не найден');
            return;
        }

        const rateLimitHTML = `
            <div class="tab_need_plus_text" style="
                display:table-cell !important;
                width:100% !important;
                height:100% !important;
                text-align:center !important;
                vertical-align:middle !important;
            ">
                <span style="display:block !important; margin-bottom: 15px;">
                    Для просмотра серии необходимо наличие <a href="/plus/">Jutsu+</a>
                </span>
                <div style="
                    margin-top:10px !important;
                    margin-bottom:6px !important;
                    font-size:14px !important;
                    color: #f44336;
                    font-weight: bold;
                ">
                    <span style="display: inline-block !important;">⛔ Превышен дневной лимит запросов</span>
                </div>
                <div style="
                    margin-top:15px !important;
                    font-size:13px !important;
                    opacity:0.85 !important;
                ">
                    <span>Вы можете запросить до 50 эпизодов в день через расширение Jut.su Extended.</span>
                </div>
                <div style="
                    margin-top:10px !important;
                    font-size:12px !important;
                    opacity:0.7 !important;
                ">
                    <span>Лимит обновится завтра. Или приобретите <a href="/plus/">Jutsu+</a> для неограниченного доступа.</span>
                </div>
            </div>
        `;

        jutsuPlusBlock.style.cssText = 'width:100%; height:100%; display:table;';
        jutsuPlusBlock.innerHTML = rateLimitHTML;

        //console.log('[VideoTracker] ✅ Показано сообщение о превышении лимита');
    }

    /**
     * Показать сообщение, что источники недоступны
     */
    showNoSourcesAvailable() {
        const jutsuPlusBlock = document.querySelector('.tab_need_plus');
        
        if (!jutsuPlusBlock) {
            //console.log('[VideoTracker] ⚠️ Блок .tab_need_plus не найден');
            return;
        }

        const noSourcesHTML = `
            <div class="tab_need_plus_text" style="
                display:table-cell !important;
                width:100% !important;
                height:100% !important;
                text-align:center !important;
                vertical-align:middle !important;
            ">
                <span style="display:block !important; margin-bottom: 15px;">
                    Для просмотра серии необходимо наличие <a href="/plus/">Jutsu+</a>
                </span>
                <div style="
                    margin-top:10px !important;
                    margin-bottom:6px !important;
                    font-size:13px !important;
                    opacity:0.85 !important;
                    color: #ff9800;
                ">
                    <span>⚠️ К сожалению, этот эпизод пока недоступен через расширение Jut.su Extended (не достаточно доноров)</span>
                </div>
                <div style="
                    margin-top:15px !important;
                    font-size:12px !important;
                    opacity:0.7 !important;
                ">
                    <span>Пожалуйста, приобретите <a href="/plus/">Jutsu+</a> для просмотра или попробуйте позже</span>
                </div>
            </div>
        `;

        jutsuPlusBlock.style.cssText = 'width:100%; height:100%; display:table;';
        jutsuPlusBlock.innerHTML = noSourcesHTML;

        //console.log('[VideoTracker] ✅ Показано сообщение о недоступности источников');
    }

    /**
     * Заменить блок с предложением Jutsu+ на блок с кнопками качества
     */
    replaceJutsuPlusBlock(sources) {
        const jutsuPlusBlock = document.querySelector('.tab_need_plus');
        
        if (!jutsuPlusBlock) {
            //console.log('[VideoTracker] ⚠️ Блок .tab_need_plus не найден');
            return;
        }

        // Создаём кнопки для каждого качества
        const qualityButtons = sources.map(source => {
            const quality = source.quality || source.resolution || 'unknown';
            return `<a href="#" class="short-btn black video vncenter the_hildi" data-quality="${quality}" data-url="${source.url}">${quality}</a>`;
        }).join('');

        const newHTML = `
            <div class="tab_need_plus_text" style="
                display:table-cell !important;
                width:100% !important;
                height:100% !important;
                text-align:center !important;
                vertical-align:middle !important;
            ">
                <span style="display:block !important;">
                    Для просмотра серии необходимо наличие <a href="/plus/">Jutsu+</a>
                </span>
                <div style="
                    margin-top:10px !important;
                    margin-bottom:6px !important;
                    font-size:13px !important;
                    opacity:0.85 !important;
                ">
                    <span>Расширение Jut.su Extended предлагает посмотреть не имея <a href="/plus/">Jutsu+</a> с помощью доноров 
                    <a href="https://jutsu.fun/#server" title="Подробнее" class="achiv_switcher_q" style="display:inline-block;" target="_blank"></a>:</span>
                </div>
                <div style="
                    display:inline-flex !important;
                    justify-content:center !important;
                    gap:8px !important;
                    flex-wrap:wrap !important;
                ">
                    ${qualityButtons}
                </div>
            </div>
        `;

        jutsuPlusBlock.style.cssText = 'width:100%; height:100%; display:table;';
        jutsuPlusBlock.innerHTML = newHTML;

        //console.log('[VideoTracker] ✅ UI блок заменён');

        // Добавляем обработчики на кнопки
        this.attachQualityButtonHandlers(jutsuPlusBlock);
    }

    /**
     * Добавить обработчики на кнопки качества
     */
    attachQualityButtonHandlers(container) {
        const buttons = container.querySelectorAll('a[data-quality]');
        
        buttons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const url = button.getAttribute('data-url');
                const quality = button.getAttribute('data-quality');
                
                //console.log('[VideoTracker] 🎬 Выбрано качество:', quality, url);
                
                // Удаляем блок с кнопками
                const jutsuPlusBlock = document.querySelector('.tab_need_plus');
                if (jutsuPlusBlock) {
                    jutsuPlusBlock.remove();
                }
                
                // Показываем индикатор загрузки
                this.showLoadingIndicator();
                
                // Даем время для применения User-Agent (увеличено до 800ms)
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Меняем источник в видео
                const videoElement = document.querySelector('video#my-player_html5_api.vjs-tech');
                if (videoElement) {
                    this.updateVideoSrc(videoElement, url, quality);
                }
            });
        });
    }

    /**
     * Показать индикатор загрузки
     */
    showLoadingIndicator() {
        const playerContainer = document.querySelector('.video-js');
        if (!playerContainer) return;

        const loader = document.createElement('div');
        loader.id = 'video-loading-indicator';
        loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            color: white;
            font-size: 18px;
            text-align: center;
        `;
        loader.innerHTML = `
            <div style="
                width: 50px;
                height: 50px;
                border: 5px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            "></div>
            <div>Загрузка видео...</div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        
        playerContainer.appendChild(loader);

        // Удаляем индикатор через 5 секунд
        setTimeout(() => {
            const indicator = document.getElementById('video-loading-indicator');
            if (indicator) indicator.remove();
        }, 2000);
    }

    /**
     * Обновить src в video элементе
     */
    updateVideoSrc(videoElement, url, quality) {
        //console.log('[VideoTracker] 🔄 Обновление источника видео...');
        
        // Останавливаем текущее воспроизведение
        videoElement.pause();
        
        // Сохраняем текущее время
        const currentTime = videoElement.currentTime || 0;
        
        // Меняем главный src
        videoElement.src = url;
        
        // Меняем src во всех source элементах с соответствующим качеством
        const sources = videoElement.querySelectorAll('source');
        sources.forEach(source => {
            const sourceQuality = source.getAttribute('label') || source.getAttribute('res');
            if (sourceQuality === quality) {
                source.setAttribute('src', url);
            }
        });
        
        // Перезагружаем видео
        videoElement.load();
        
        // Восстанавливаем время после загрузки метаданных
        videoElement.addEventListener('loadedmetadata', function restoreTime() {
            if (currentTime > 0) {
                videoElement.currentTime = currentTime;
            }
            videoElement.removeEventListener('loadedmetadata', restoreTime);
        });
        
        // Автовоспроизведение после загрузки
        videoElement.addEventListener('canplay', function autoplay() {
            videoElement.play().catch(err => {
                //console.log('[VideoTracker] Автовоспроизведение заблокировано:', err);
            });
            videoElement.removeEventListener('canplay', autoplay);
        });
        
        //console.log('[VideoTracker] ✅ Источник видео обновлён:', quality, url);
    }

    /**
     * Собрать данные о видео
     */
    async collectVideoData(videoElement, sources) {
        const videoSources = [];
        
        sources.forEach(source => {
            const src = source.getAttribute('src');
            const type = source.getAttribute('type');
            const label = source.getAttribute('label');
            const res = source.getAttribute('res');
            
            if (type === 'video/mp4' && src) {
                videoSources.push({
                    url: src,
                    quality: label || res || 'unknown',
                    resolution: res || null
                });
            }
        });

        const cookies = await this.getCookies();

        const metadata = {
            pageUrl: window.location.href,
            pathname: window.location.pathname,
            animeName: this.extractAnimeName(),
            episodeInfo: this.extractEpisodeInfo(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        return {
            sources: videoSources,
            cookies: cookies,
            metadata: metadata
        };
    }

    /**
     * Получить куки через Chrome API
     */
    async getCookies() {
        try {
            const response = await this.sendToBackground('GET_COOKIES', {
                url: window.location.href,
                names: ['dle_user_id', 'dle_password', 'PHPSESSID']
            });
            
            if (response.success) {
                return response.data;
            } else {
                //console.error('[VideoTracker] ❌ Ошибка получения куки:', response.error);
                return {};
            }
        } catch (error) {
            //console.error('[VideoTracker] ❌ Ошибка запроса куки:', error);
            return {};
        }
    }

    /**
     * Извлечь название аниме из URL
     */
    extractAnimeName() {
        const path = window.location.pathname;
        const match = path.match(/^\/([^\/]+)\//);
        return match ? match[1] : null;
    }

    /**
     * Извлечь информацию об эпизоде
     */
    extractEpisodeInfo() {
        const path = window.location.pathname;
        
        let match = path.match(/season-(\d+)\/episode-(\d+)/);
        if (match) {
            return {
                type: 'episode',
                season: parseInt(match[1]),
                episode: parseInt(match[2])
            };
        }
        
        match = path.match(/episode-(\d+)/);
        if (match) {
            return {
                type: 'episode',
                season: null,
                episode: parseInt(match[1])
            };
        }
        
        match = path.match(/film-(\d+)/);
        if (match) {
            return {
                type: 'film',
                number: parseInt(match[1])
            };
        }
        
        return null;
    }

    /**
     * Отправить данные в background worker через мост
     */
    async sendToBackground(action, data) {
        return new Promise((resolve, reject) => {
            const requestId = `video_${++this.requestId}_${Date.now()}`;
            
            const listener = (event) => {
                if (event.source !== window) return;
                
                const message = event.data;
                
                if (message.type === 'BACKGROUND_RESPONSE' && message.requestId === requestId) {
                    window.removeEventListener('message', listener);
                    
                    if (message.success) {
                        resolve({ success: true, data: message.data });
                    } else {
                        resolve({ success: false, error: message.error });
                    }
                }
            };
            
            window.addEventListener('message', listener);
            
            window.postMessage({
                type: 'BACKGROUND_REQUEST',
                requestId: requestId,
                action: action,
                data: data
            }, '*');
            
            setTimeout(() => {
                window.removeEventListener('message', listener);
                reject(new Error('Timeout: ответ не получен от background'));
            }, 10000);
        });
    }

    /**
     * Отслеживание изменений URL (для SPA)
     */
    observeUrlChanges() {
        let lastUrl = window.location.href;
        
        const observer = new MutationObserver(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                //console.log('[VideoTracker] 🔄 URL изменён:', currentUrl);
                
                this.lastSentUrl = null;
                this.userAgentSet = false;
                this.stopTracking();
                
                // Сбрасываем User-Agent при переходе
                this.sendToBackground('RESET_USER_AGENT', {}).catch(console.error);
                
                if (this.isVideoPage()) {
                    setTimeout(() => {
                        this.startTracking();
                    }, 1000);
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

window.VideoTracker = VideoTracker;