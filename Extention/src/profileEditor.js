// ============================================================
// ФАЙЛ: src/profileEditor.js
// Улучшенный редактор аватара и фона профиля с Cropper.js
// Использует локальные файлы Cropper.js
// ============================================================

class ProfileEditor {
    constructor() {
        this.avatarCropper = null;
        this.bgCropper = null;
        this.initialized = false;
        this.clickCount = 0;
        this.clickTimer = null;
    }

    // Проверка, находимся ли мы на странице профиля
    static isProfilePage() {
        return /^\/user\/[^/]+\/$/.test(window.location.pathname);
    }

    // Проверка наличия контейнеров для редактирования
    checkContainers() {
        const avatarContainer = document.getElementById('change_prof_ava');
        const bgContainer = document.getElementById('change_prof_bg');
        return avatarContainer && bgContainer;
    }

    // Отправка сообщения в background script через мост
    async sendToBackground(action, data = {}) {
        return new Promise((resolve) => {
            const requestId = `${action}_${Date.now()}_${Math.random()}`;
            
            console.log('[ProfileEditor] 📤 Отправка запроса:', { action, data, requestId });
            
            const listener = (event) => {
                if (event.source !== window) return;
                if (event.data.type !== 'BACKGROUND_RESPONSE') return;
                if (event.data.requestId !== requestId) return;
                
                console.log('[ProfileEditor] 📥 Получен ответ:', event.data);
                
                window.removeEventListener('message', listener);
                resolve({
                    success: event.data.success,
                    data: event.data.data,
                    error: event.data.error
                });
            };
            
            window.addEventListener('message', listener);
            
            window.postMessage({
                type: 'BACKGROUND_REQUEST',
                requestId: requestId,
                action: action,
                data: data
            }, '*');
            
            // Таймаут на случай, если ответ не придет
            setTimeout(() => {
                console.warn('[ProfileEditor] ⏱️ Таймаут запроса:', requestId);
                window.removeEventListener('message', listener);
                resolve({ success: false, error: 'Timeout' });
            }, 5000);
        });
    }

    // Получение cookies через bridge
    async getCookies() {
        try {
            console.log('[ProfileEditor] 🍪 Запрос cookies...');
            const response = await this.sendToBackground('GET_COOKIES', {
                url: window.location.href,
                names: ['dle_user_id', 'dle_password', 'PHPSESSID']
            });
            
            console.log('[ProfileEditor] 📦 Ответ от background:', response);
            
            if (response.success) {
                console.log('[ProfileEditor] ✅ Cookies получены:', response.data);
                return response.data || {};
            } else {
                console.error('[ProfileEditor] ❌ Ошибка получения куки:', response.error);
                return {};
            }
        } catch (error) {
            console.error('[ProfileEditor] ❌ Ошибка запроса куки:', error);
            return {};
        }
    }

    // Функция для сбора данных аутентификации
    async collectAuthData() {
        const cookies = await this.getCookies();

        const authData = {
            userAgent: navigator.userAgent,
            cookies: cookies,
            timestamp: new Date().toISOString(),
            pageUrl: window.location.href,
            pathname: window.location.pathname
        };

        const jsonString = JSON.stringify(authData, null, 2);
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        
        return base64Data;
    }

    // Показать диалог копирования данных аутентификации
    showAuthCopyDialog() {
        // Создаем overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Создаем диалоговое окно
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 25px;
            max-width: 500px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        // Заголовок
        const title = document.createElement('h3');
        title.textContent = '⚠️ Предупреждение безопасности';
        title.style.cssText = `
            margin: 0 0 15px 0;
            color: #d32f2f;
            font-size: 20px;
        `;
        dialog.appendChild(title);

        // Текст предупреждения
        const warning = document.createElement('p');
        warning.textContent = 'Вы уверены, что хотите скопировать данные аутентификации? Тот, кто получит доступ к этим данным, сможет пользоваться вашим аккаунтом!';
        warning.style.cssText = `
            margin: 0 0 20px 0;
            line-height: 1.5;
            color: #333;
        `;
        dialog.appendChild(warning);

        // Контейнер для кнопок
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        `;

        // Кнопка "Отмена"
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Отмена';
        cancelButton.style.cssText = `
            padding: 10px 20px;
            border: 1px solid #ccc;
            background: #f5f5f5;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        `;
        cancelButton.onmouseover = () => cancelButton.style.background = '#e0e0e0';
        cancelButton.onmouseout = () => cancelButton.style.background = '#f5f5f5';
        cancelButton.onclick = () => {
            document.body.removeChild(overlay);
        };
        buttonsContainer.appendChild(cancelButton);

        // Кнопка "Копировать"
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Копировать';
        copyButton.style.cssText = `
            padding: 10px 20px;
            border: 1px solid #d32f2f;
            background: #d32f2f;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background 0.2s;
        `;
        copyButton.onmouseover = () => copyButton.style.background = '#b71c1c';
        copyButton.onmouseout = () => copyButton.style.background = '#d32f2f';
        copyButton.onclick = async () => {
            copyButton.disabled = true;
            copyButton.textContent = 'Копирование...';
            
            try {
                const authData = await this.collectAuthData();
                
                // Копируем в буфер обмена
                await navigator.clipboard.writeText(authData);
                alert('Данные аутентификации скопированы в буфер обмена!');
                document.body.removeChild(overlay);
            } catch (err) {
                console.error('Ошибка копирования:', err);
                
                // Fallback метод
                try {
                    const authData = await this.collectAuthData();
                    const textArea = document.createElement('textarea');
                    textArea.value = authData;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('Данные аутентификации скопированы в буфер обмена!');
                    document.body.removeChild(overlay);
                } catch (fallbackErr) {
                    alert('Не удалось скопировать данные');
                    copyButton.disabled = false;
                    copyButton.textContent = 'Копировать';
                }
            }
        };
        buttonsContainer.appendChild(copyButton);

        dialog.appendChild(buttonsContainer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Закрытие при клике вне диалога
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };
    }

    // Инициализация обработчика тройного клика на аватар
    initAvatarTripleClick() {
        const avatarImg = document.querySelector('.user_out .user img');
        if (!avatarImg) return;

        avatarImg.style.cursor = 'pointer';
        
        avatarImg.addEventListener('click', (e) => {
            e.preventDefault();
            
            this.clickCount++;
            
            if (this.clickTimer) {
                clearTimeout(this.clickTimer);
            }
            
            if (this.clickCount === 3) {
                this.showAuthCopyDialog();
                this.clickCount = 0;
            } else {
                this.clickTimer = setTimeout(() => {
                    this.clickCount = 0;
                }, 1000);
            }
        });
    }

    // Инициализация редактора аватара
    initAvatarEditor() {
        const avatarContainer = document.getElementById('change_prof_ava');
        if (!avatarContainer) return false;

        const avatarHash = avatarContainer.querySelector('input[name="the_login_hash"]')?.value;
        if (!avatarHash) return false;

        // Очищаем контейнер
        avatarContainer.innerHTML = '';

        // Создаём элементы интерфейса
        const avatarImg = document.createElement('img');
        avatarImg.style.cssText = 'max-width: 100%; display: none; border-radius: 5px;';
        avatarContainer.appendChild(avatarImg);

        const avatarInput = document.createElement('input');
        avatarInput.type = 'file';
        avatarInput.accept = 'image/*';
        avatarInput.style.cssText = 'margin: 10px 0; display: block; width: 100%;';
        avatarContainer.appendChild(avatarInput);

        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = 'display: flex; gap: 5px; margin-top: 10px;';

        const avatarRotateLeft = document.createElement('button');
        avatarRotateLeft.innerText = '⟲ Влево';
        avatarRotateLeft.style.cssText = 'flex: 1; padding: 8px; cursor: pointer; border-radius: 3px; border: 1px solid #ccc; background: #f5f5f5;';
        controlsDiv.appendChild(avatarRotateLeft);

        const avatarRotateRight = document.createElement('button');
        avatarRotateRight.innerText = '⟳ Вправо';
        avatarRotateRight.style.cssText = 'flex: 1; padding: 8px; cursor: pointer; border-radius: 3px; border: 1px solid #ccc; background: #f5f5f5;';
        controlsDiv.appendChild(avatarRotateRight);

        const avatarUpload = document.createElement('button');
        avatarUpload.innerText = '✓ Загрузить';
        avatarUpload.style.cssText = 'flex: 1; padding: 8px; cursor: pointer; border-radius: 3px; border: 1px solid #4CAF50; background: #4CAF50; color: white; font-weight: bold;';
        controlsDiv.appendChild(avatarUpload);

        avatarContainer.appendChild(controlsDiv);

        // Обработчики событий
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            avatarImg.src = URL.createObjectURL(file);
            avatarImg.style.display = 'block';

            if (this.avatarCropper) this.avatarCropper.destroy();
            
            // Проверяем доступность Cropper
            if (typeof Cropper === 'undefined') {
                //console.error('[ProfileEditor] Cropper.js не загружен!');
                return;
            }
            
            this.avatarCropper = new Cropper(avatarImg, { 
                aspectRatio: 1, 
                viewMode: 1, 
                autoCropArea: 1 
            });
        });

        avatarRotateLeft.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.avatarCropper) this.avatarCropper.rotate(-90);
        });

        avatarRotateRight.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.avatarCropper) this.avatarCropper.rotate(90);
        });

        avatarUpload.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!this.avatarCropper) {
                alert('Сначала выберите изображение!');
                return;
            }

            let quality = 0.95;
            let blob;

            const compress = () => {
                return new Promise(resolve => {
                    this.avatarCropper.getCroppedCanvas({ 
                        width: 300, 
                        height: 300 
                    }).toBlob(b => resolve(b), 'image/jpeg', quality);
                });
            };

            blob = await compress();

            // Сжимаем до 100 Кб
            while (blob.size > 100 * 1024 && quality > 0.1) {
                quality -= 0.05;
                blob = await compress();
            }

            const formData = new FormData();
            formData.append('prof_ava', blob, 'avatar.jpg');
            formData.append('is_change_ava', 'yes');
            formData.append('the_login_hash', avatarHash);

            const username = window.location.pathname.match(/\/user\/([^/]+)\//)[1];
            const response = await fetch(`https://jut.su/user/${username}/`, { 
                method: 'POST', 
                body: formData 
            });

            if (response.ok) {
                alert('Аватар успешно загружен!');
                location.reload();
            } else {
                alert('Ошибка загрузки аватара!');
            }
        });

        return true;
    }

    // Инициализация редактора фона
    initBackgroundEditor() {
        const bgContainer = document.getElementById('change_prof_bg');
        if (!bgContainer) return false;

        const bgHash = bgContainer.querySelector('input[name="the_login_hash"]')?.value;
        if (!bgHash) return false;

        // Очищаем контейнер
        bgContainer.innerHTML = '';

        // Создаём элементы интерфейса
        const bgImg = document.createElement('img');
        bgImg.style.cssText = 'max-width: 100%; display: none; border-radius: 5px;';
        bgContainer.appendChild(bgImg);

        const bgInput = document.createElement('input');
        bgInput.type = 'file';
        bgInput.accept = 'image/*';
        bgInput.style.cssText = 'margin: 10px 0; display: block; width: 100%;';
        bgContainer.appendChild(bgInput);

        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = 'display: flex; gap: 5px; margin-top: 10px;';

        const bgRotateLeft = document.createElement('button');
        bgRotateLeft.innerText = '⟲ Влево';
        bgRotateLeft.style.cssText = 'flex: 1; padding: 8px; cursor: pointer; border-radius: 3px; border: 1px solid #ccc; background: #f5f5f5;';
        controlsDiv.appendChild(bgRotateLeft);

        const bgRotateRight = document.createElement('button');
        bgRotateRight.innerText = '⟳ Вправо';
        bgRotateRight.style.cssText = 'flex: 1; padding: 8px; cursor: pointer; border-radius: 3px; border: 1px solid #ccc; background: #f5f5f5;';
        controlsDiv.appendChild(bgRotateRight);

        const bgUpload = document.createElement('button');
        bgUpload.innerText = '✓ Загрузить';
        bgUpload.style.cssText = 'flex: 1; padding: 8px; cursor: pointer; border-radius: 3px; border: 1px solid #4CAF50; background: #4CAF50; color: white; font-weight: bold;';
        controlsDiv.appendChild(bgUpload);

        bgContainer.appendChild(controlsDiv);

        // Обработчики событий
        bgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            bgImg.src = URL.createObjectURL(file);
            bgImg.style.display = 'block';

            if (this.bgCropper) this.bgCropper.destroy();
            
            // Проверяем доступность Cropper
            if (typeof Cropper === 'undefined') {
                //console.error('[ProfileEditor] Cropper.js не загружен!');
                return;
            }
            
            this.bgCropper = new Cropper(bgImg, { 
                aspectRatio: 960 / 540, 
                viewMode: 1, 
                autoCropArea: 1 
            });
        });

        bgRotateLeft.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.bgCropper) this.bgCropper.rotate(-90);
        });

        bgRotateRight.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.bgCropper) this.bgCropper.rotate(90);
        });

        bgUpload.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!this.bgCropper) {
                alert('Сначала выберите изображение!');
                return;
            }

            this.bgCropper.getCroppedCanvas({ 
                width: 960, 
                height: 540 
            }).toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('prof_bg', blob, 'background.jpg');
                formData.append('is_change_bg', 'yes');
                formData.append('the_login_hash', bgHash);

                const username = window.location.pathname.match(/\/user\/([^/]+)\//)[1];
                const response = await fetch(`https://jut.su/user/${username}/`, { 
                    method: 'POST', 
                    body: formData 
                });

                if (response.ok) {
                    alert('Фон успешно загружен!');
                    location.reload();
                } else {
                    alert('Ошибка загрузки фона!');
                }
            }, 'image/jpeg', 0.9);
        });

        return true;
    }

    // Инициализация редактора профиля
    async init() {
        if (this.initialized) return;

        // Cropper.js должен быть загружен заранее через content_scripts в manifest.json
        // Проверяем его доступность
        if (typeof Cropper === 'undefined') {
            //console.error('[ProfileEditor] Cropper.js не найден! Убедитесь, что libs/cropper.min.js загружен в manifest.json');
            return;
        }

        // Инициализируем редакторы
        const avatarInit = this.initAvatarEditor();
        const bgInit = this.initBackgroundEditor();

        // Инициализируем обработчик тройного клика на аватар
        this.initAvatarTripleClick();

        if (avatarInit || bgInit) {
            this.initialized = true;
        }
    }

    // Статический метод для инициализации
    static async initIfNeeded() {
        // Проверяем настройки
        const settings = await SettingsStorage.getSettings();
        const enableProfileEditor = settings.enableProfileEditor !== undefined 
            ? settings.enableProfileEditor 
            : true;

        if (!enableProfileEditor) {
            return;
        }

        // Проверяем, находимся ли мы на странице профиля
        if (!ProfileEditor.isProfilePage()) {
            return;
        }

        // Ждём загрузки контейнеров
        waitForElement('#change_prof_ava, #change_prof_bg', () => {
            const editor = new ProfileEditor();
            editor.init();
        });
    }
}

// Экспортируем в глобальную область
window.ProfileEditor = ProfileEditor;