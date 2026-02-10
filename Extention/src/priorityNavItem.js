// ============================================================
// ФАЙЛ: src/priorityNavItem.js
// Создай новый файл src/priorityNavItem.js и скопируй этот код
// ============================================================

// Конфигурация приоритетного элемента навигации
const PRIORITY_NAV_ITEM = {
    href: 'https://jutsu.fun/',
    text: 'Jut.su Extended',
    position: 'first', // 'first' или 'last'
    addSeparator: true // добавлять ли разделитель
};

// Класс для добавления приоритетного элемента навигации
class PriorityNavItem {
    constructor(config, selectors) {
        this.config = config;
        this.selectors = selectors;
        this.currentPath = window.location.pathname;
    }

    // Найти контейнер навигации
    findNavContainer() {
        return document.querySelector(this.selectors.container);
    }

    // Найти элемент с таким href
    findItemByHref(container, href) {
        const links = container.querySelectorAll(this.selectors.link);
        for (let link of links) {
            if (link.getAttribute('href') === href) {
                return link.parentElement; // возвращаем <li>
            }
        }
        return null;
    }

    // Найти разделитель приоритетного элемента
    findPrioritySeparator(container) {
        const separators = container.querySelectorAll('[data-priority-separator="true"]');
        return separators.length > 0 ? separators[0] : null;
    }

    // Проверить, является ли ссылка активной
    isActiveLink(href) {
        if (this.currentPath === href) {
            return true;
        }
        
        if (href === '/anime/' && (this.currentPath === '/' || this.currentPath.startsWith('/anime/'))) {
            return true;
        }
        
        if (href !== '/' && this.currentPath.startsWith(href)) {
            return true;
        }
        
        return false;
    }

    // Создать элемент навигации
    createNavItem() {
        const li = document.createElement('li');
        const a = document.createElement('a');
        
        a.href = this.config.href;
        a.target = "_blank"
        a.textContent = this.config.text;
        
        if (this.isActiveLink(this.config.href)) {
            a.className = 'active';
        }
        
        li.appendChild(a);
        li.setAttribute('data-priority-item', 'true'); // маркер приоритетного элемента
        return li;
    }

    // Создать разделитель
    createSeparator() {
        const li = document.createElement('li');
        li.className = 'snl_group_last';
        li.innerHTML = '<span></span>';
        li.setAttribute('data-priority-separator', 'true'); // маркер разделителя приоритетного элемента
        return li;
    }

    // Переместить или создать элемент в нужной позиции
    ensurePosition(container) {
        // Ищем существующий элемент
        let existingItem = this.findItemByHref(container, this.config.href);
        
        // Если элемент не найден, создаём новый
        if (!existingItem) {
            existingItem = this.createNavItem();
            //console.log('[PriorityNavItem] Создан новый элемент:', this.config.text);
        } else {
            // Обновляем активное состояние
            const link = existingItem.querySelector('a');
            if (link) {
                if (this.isActiveLink(this.config.href)) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
            existingItem.setAttribute('data-priority-item', 'true');
        }

        // Ищем или создаём разделитель
        let separator = null;
        if (this.config.addSeparator) {
            separator = this.findPrioritySeparator(container);
            if (!separator) {
                separator = this.createSeparator();
                //console.log('[PriorityNavItem] Создан разделитель');
            }
        }

        // Проверяем, находится ли элемент в правильной позиции
        if (this.config.position === 'first') {
            // Добавляем в начало
            const firstChild = container.firstChild;
            
            // Если элемент не первый или его вообще нет в контейнере
            if (existingItem !== firstChild || !existingItem.parentElement) {
                if (firstChild) {
                    container.insertBefore(existingItem, firstChild);
                } else {
                    container.appendChild(existingItem);
                }
                //console.log('[PriorityNavItem] Элемент перемещён в начало:', this.config.text);
            }

            // Добавляем разделитель ПОСЛЕ элемента (снизу)
            if (separator) {
                const nextSibling = existingItem.nextSibling;
                if (nextSibling !== separator) {
                    container.insertBefore(separator, nextSibling);
                    //console.log('[PriorityNavItem] Разделитель добавлен после элемента');
                }
            }
        } else {
            // position === 'last' - добавляем в конец
            
            // Добавляем разделитель ПЕРЕД элементом (сверху)
            if (separator) {
                const lastChild = container.lastChild;
                
                // Проверяем, нужно ли перемещать разделитель
                if (separator.nextSibling !== existingItem || !separator.parentElement) {
                    if (lastChild) {
                        container.appendChild(separator);
                    }
                    //console.log('[PriorityNavItem] Разделитель добавлен перед элементом');
                }
            }

            // Добавляем элемент в конец
            const lastChild = container.lastChild;
            if (existingItem !== lastChild || !existingItem.parentElement) {
                container.appendChild(existingItem);
                //console.log('[PriorityNavItem] Элемент перемещён в конец:', this.config.text);
            }
        }

        return true;
    }

    // Основная функция
    add() {
        const container = this.findNavContainer();
        
        if (!container) {
            //console.warn('[PriorityNavItem] Контейнер навигации не найден');
            return false;
        }
        
        return this.ensurePosition(container);
    }

    // Запустить добавление с ожиданием загрузки DOM
    static async init() {
        const item = new PriorityNavItem(PRIORITY_NAV_ITEM, window.NAV_SELECTORS);
        
        const added = item.add();
        
        if (!added) {
            waitForElement(item.selectors.container, () => {
                item.add();
            });
        }
    }
}

function createServerStatusItem(role = 'unknown') {
    const item = document.createElement('div');
    item.className = 'vncenter donor-status';
    item.dataset.serverStatus = 'true';

    const label = document.createElement('span');
    label.style.color = '#81a834';
    label.style.cursor = 'pointer';
    label.textContent = getServerStatusLabel(role);
    label.title = getServerStatusTitle(role);

    item.appendChild(label);
    item.addEventListener('click', () => {
        window.open('https://jutsu.fun/#server', '_blank');
    });

    return item;
}

function getServerStatusLabel(role) {
    if (role === 'off') return '● Server Mode Disabled';
    if (role === 'donor') return '● Donor Mode Active';
    if (role === 'recipient') return '● Recipient Mode Active';
    return '● Server Mode Active';
}

function getServerStatusTitle(role) {
    if (role === 'off') return 'Серверные функции отключены';
    if (role === 'donor') return 'Вы делитесь аниме с сообществом';
    if (role === 'recipient') return 'Вы смотрите аниме благодаря донорам';
    return 'Серверные функции включены';
}

function updateServerStatusElement(element, role) {
    if (!element) return;
    const label = element.querySelector('span');
    if (!label) return;
    label.textContent = getServerStatusLabel(role);
    label.title = getServerStatusTitle(role);
}

async function initServerStatusIndicator() {
    if (!window.SettingsStorage || typeof SettingsStorage.getSettings !== 'function') {
        return;
    }

    const settings = await SettingsStorage.getSettings();
    if (!settings.enableServerConnection) {
        return;
    }

    const attachIndicator = (nav) => {
        const existing = nav.querySelector('[data-server-status="true"]');
        if (existing) {
            updateServerStatusElement(existing, 'unknown');
            return;
        }

        const statusItem = createServerStatusItem('unknown');
        nav.appendChild(statusItem);
    };

    if (typeof waitForElement === 'function') {
        waitForElement('.v_epi_nav', attachIndicator, 10000);
    } else {
        const nav = document.querySelector('.v_epi_nav');
        if (nav) attachIndicator(nav);
    }

    window.addEventListener('jutsu-server-status', (event) => {
        const role = event?.detail?.role || 'unknown';
        const nav = document.querySelector('.v_epi_nav');
        if (!nav) return;
        const existing = nav.querySelector('[data-server-status="true"]');
        if (!existing) {
            attachIndicator(nav);
        }
        updateServerStatusElement(nav.querySelector('[data-server-status="true"]'), role);
    });

    if (SettingsStorage.onSettingsChanged) {
        SettingsStorage.onSettingsChanged((changes) => {
            if (!('enableServerConnection' in changes)) return;
            const nav = document.querySelector('.v_epi_nav');
            const existing = nav?.querySelector('[data-server-status="true"]');
            if (changes.enableServerConnection) {
                if (nav) attachIndicator(nav);
            } else if (existing) {
                existing.remove();
            }
        });
    }
}

window.PriorityNavItem = PriorityNavItem;
window.PRIORITY_NAV_ITEM = PRIORITY_NAV_ITEM;
window.initServerStatusIndicator = initServerStatusIndicator;