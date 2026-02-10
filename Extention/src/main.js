// ============================================================
// ФАЙЛ: src/main.js (ПОЛНОСТЬЮ АВТОМАТИЧЕСКИЙ)
// ============================================================

(async function init() {
    // Получаем настройки
    const settings = await SettingsStorage.getSettings();

    // ===================================
    // АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ МОДУЛЕЙ
    // ===================================
    
    const modules = {
        // Video Tracker
        VideoTracker: {
            settingKey: 'enableServerConnection',
            init: () => {
                if (window.VideoTracker) {
                    const tracker = new VideoTracker();
                    tracker.init();
                }
            }
        },
        
        // Редактор профиля
        ProfileEditor: {
            settingKey: 'enableProfileEditor',
            init: () => {
                if (window.ProfileEditor && ProfileEditor.isProfilePage()) {
                    ProfileEditor.initIfNeeded();
                }
            }
        },
        
        // Страница аниме пользователя
        UserAnimePage: {
            settingKey: 'enableUserAnimePage',
            init: () => {
                if (window.UserAnimePage) {
                    UserAnimePage.init();
                }
            },
            toggle: (enabled) => {
                if (window.UserAnimePage) {
                    if (enabled) {
                        UserAnimePage.init();
                    } else {
                        UserAnimePage.remove();
                    }
                }
            }
        },
        
        // Расширение страницы команды
        TeamPageExtension: {
            settingKey: null, // Всегда включено
            init: () => {
                if (window.TeamPageExtension) {
                    TeamPageExtension.init();
                }
            }
        },
        
        // Страница Jutsu Extended
        JutsuExtendedPage: {
            settingKey: null, // Всегда включено
            init: () => {
                if (window.JutsuExtendedPage) {
                    JutsuExtendedPage.init();
                }
            }
        },
        
        // Восстановление навигации
        NavigationRestorer: {
            settingKey: 'restoreNavigation',
            init: () => {
                if (window.NavigationRestorer) {
                    NavigationRestorer.init();
                }
            }
        },
        
        // Чат
        ChatWidget: {
            settingKey: 'showChat',
            init: () => {
                if (window.ChatWidget) {
                    ChatWidget.init();
                }
            },
            toggle: (enabled) => {
                if (window.ChatWidget) {
                    ChatWidget.toggle(enabled);
                }
            }
        },
        
        // Слайдер скорости видео
        VideoSpeedSlider: {
            settingKey: 'enableSpeedSettingInVideoPlayer',
            init: () => {
                if (typeof initVideoSpeedSlider === 'function') {
                    initVideoSpeedSlider();
                }
            },
            toggle: (enabled) => {
                if (!enabled) {
                    // Удаляем кнопку скорости
                    if (window.videojs && videojs.getPlayers) {
                        const players = Object.values(videojs.getPlayers());
                        if (players.length) {
                            const player = players[0];
                            const speedButton = player.controlBar.getChild('SpeedMenuButton');
                            if (speedButton) {
                                player.controlBar.removeChild(speedButton);
                            }
                        }
                    }
                } else {
                    if (typeof initVideoSpeedSlider === 'function') {
                        initVideoSpeedSlider();
                    }
                }
            }
        }
    };

    // Запускаем модули на основе настроек
    Object.entries(modules).forEach(([name, module]) => {
        if (module.settingKey === null || settings[module.settingKey]) {
            module.init();
        }
    });

    // Проверяем, не заблокирован ли текущий путь
    if (typeof isPathBlocked === 'function' && typeof BLOCKED_PATHS !== 'undefined') {
        if (isPathBlocked(BLOCKED_PATHS)) {
            return;
        }
    }

    // Создаём менеджер DOM
    const domManager = new DOMManager();
    
    // Инициализация приоритетного элемента навигации
    if (window.PriorityNavItem) {
        PriorityNavItem.init();
    }
    
    // Если кнопка достижений отключена, завершаем инициализацию
    if (!settings.showAchievementsButton) {
        return;
    }

    let updateInterval = null;

    // Ждём появления навигации для кнопки достижений
    if (typeof waitForElement === 'function' && typeof createAchievementsButton === 'function') {
        waitForElement('.v_epi_nav', (navElement) => {
            // Создаём overlay (затемнённый фон)
            const overlay = createOverlay(COLORS, () => {
                panelManager.close();
            });
            domManager.addElement('overlay', overlay);
            domManager.appendToBody(overlay);

            // Создаём панель достижений
            const panel = createModalPanel(COLORS);
            domManager.addElement('panel', panel);
            domManager.appendToBody(panel);

            // Создаём менеджер панели
            const panelManager = new AchievementsPanelManager(panel, overlay, COLORS);

            // Создаём кнопку достижений
            const achievementsButton = createAchievementsButton(COLORS);
            domManager.addElement('achievementsButton', achievementsButton);

            // Вставляем кнопку после навигации
            const listButton = navElement.querySelector('.vncenter');
            if (listButton) {
                domManager.insertAfter(achievementsButton, listButton);
            } else {
                domManager.appendChild(navElement, achievementsButton);
            }

            // Обработчик клика по кнопке
            achievementsButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                panelManager.toggle();
            });

            // Обновляем счётчик достижений на кнопке
            const updateButtonCounter = () => {
                waitForAchievementsData(() => {
                    const count = countAchievements();
                    updateButtonText(achievementsButton, COLORS, count);
                });
            };

            // Запускаем обновление счётчика
            updateButtonCounter();

            // Обновляем счётчик каждые 30 секунд
            if (updateInterval) {
                clearInterval(updateInterval);
            }
            updateInterval = setInterval(updateButtonCounter, 30000);
        }, 100);
    }

    // ===================================
    // АВТОМАТИЧЕСКАЯ ОБРАБОТКА ИЗМЕНЕНИЙ НАСТРОЕК
    // ===================================
    SettingsStorage.onSettingsChanged((updatedSettings) => {
        // Проходим по всем измененным настройкам
        Object.entries(updatedSettings).forEach(([key, value]) => {
            // Находим модуль с этой настройкой
            const moduleEntry = Object.entries(modules).find(
                ([_, module]) => module.settingKey === key
            );
            
            if (moduleEntry) {
                const [moduleName, module] = moduleEntry;
                
                // Если у модуля есть метод toggle, используем его
                if (module.toggle) {
                    module.toggle(value);
                } else {
                    // Иначе перезагружаем страницу для применения изменений
                    location.reload();
                }
            }
        });

        // Специальная обработка для кнопки достижений
        if ('showAchievementsButton' in updatedSettings) {
            const button = domManager.getElement('achievementsButton');
            const panel = domManager.getElement('panel');
            const overlay = domManager.getElement('overlay');

            if (updatedSettings.showAchievementsButton) {
                if (button) button.style.display = 'inline-block';
            } else {
                if (button) button.style.display = 'none';
                if (panel && overlay) {
                    panel.style.display = 'none';
                    overlay.style.display = 'none';
                }
            }
        }
    });
})();