// ============================================================
// ФАЙЛ: src/videoSpeedSlider.js
// ============================================================

/**
 * Ожидание появления video.js
 */
function waitForVideoJS(callback, interval = 200) {
    const checkInterval = setInterval(() => {
        if (window.videojs && videojs.getPlayers) {
            const players = Object.values(videojs.getPlayers());
            if (players.length) {
                clearInterval(checkInterval);
                callback(players[0]);
            }
        }
    }, interval);
    return checkInterval;
}

/**
 * Инжект CSS для слайдера скорости
 */
function injectSpeedSliderCSS() {
    if (document.getElementById('vjs-speed-slider-style')) return;

    const style = document.createElement('style');
    style.id = 'vjs-speed-slider-style';
    style.textContent = `
        /* Иконка кнопки */
        .vjs-speed-menu-button .vjs-icon-placeholder::before {
            content: '⏩';
            font-size: 16px;
            line-height: 1;
        }

        /* li пункта меню */
        .vjs-speed-menu-button .vjs-menu-item.vjs-speed-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 8px 12px;
        }

        .vjs-speed-menu-button .vjs-speed-range {
            width: 100%;
        }

        .vjs-speed-menu-button .vjs-speed-value {
            text-align: center;
            font-size: 11px;
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Добавление меню скорости в controlBar Video.js
 */
function addSpeedSlider(player) {
    injectSpeedSliderCSS();

    const MenuButton = videojs.getComponent('MenuButton');
    const Menu = videojs.getComponent('Menu');
    const MenuItem = videojs.getComponent('MenuItem');

    // Пункт меню со слайдером
    class SpeedMenuItem extends MenuItem {
        constructor(player, options) {
            super(player, options);
            this.addClass('vjs-speed-item');

            // Убираем родной текст MenuItem
            this.el().querySelector('.vjs-menu-item-text').textContent = 'Скорость';

            // Создаем input range
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0.1';
            slider.max = '16';
            slider.step = '0.1';
            slider.value = player.playbackRate();
            slider.className = 'vjs-speed-range';

            // Текстовое значение
            const value = document.createElement('div');
            value.className = 'vjs-speed-value';
            value.textContent = slider.value + 'x';

            slider.addEventListener('input', () => {
                const rate = parseFloat(slider.value);
                player.playbackRate(rate);
                value.textContent = rate + 'x';
            });

            this.el().appendChild(slider);
            this.el().appendChild(value);
        }
    }

    // Кнопка меню скорости
    class SpeedMenuButton extends MenuButton {
        constructor(player, options) {
            super(player, options);
            this.controlText('Скорость');
            this.addClass('vjs-speed-menu-button');
        }

        createMenu() {
            const menu = new Menu(this.player());

            // Добавляем один пункт меню — слайдер
            menu.addChild(new SpeedMenuItem(this.player(), {}));

            return menu;
        }
    }

    // Регистрируем компонент
    videojs.registerComponent('SpeedMenuButton', SpeedMenuButton);

    // Добавляем кнопку в controlBar
    player.ready(() => {
        player.controlBar.addChild('SpeedMenuButton', {}, player.controlBar.children().length - 1);
    });
}

/**
 * Инициализация
 */
function initVideoSpeedSlider() {
    waitForVideoJS(player => {
        addSpeedSlider(player);
    });
}
