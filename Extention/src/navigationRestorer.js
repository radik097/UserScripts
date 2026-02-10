// ============================================================
// ФАЙЛ: src/navigationRestorer.js (ОБНОВЛЁННЫЙ)
// Замени содержимое файла src/navigationRestorer.js
// ============================================================

class NavigationRestorer {
    constructor(navConfig, selectors) {
        this.config = navConfig;
        this.selectors = selectors;
        this.currentPath = window.location.pathname;
    }

    findNavContainer() {
        return document.querySelector(this.selectors.container);
    }

    linkExists(container, href) {
        const links = container.querySelectorAll(this.selectors.link);
        for (let link of links) {
            if (link.getAttribute('href') === href) {
                return link.parentElement;
            }
        }
        return null;
    }

    createNavItem(config) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        
        a.href = config.href;
        a.textContent = config.text;
        
        if (this.isActiveLink(config.href)) {
            a.className = 'active';
        }
        
        li.appendChild(a);
        return li;
    }

    createSeparator() {
        const li = document.createElement('li');
        li.className = GROUP_SEPARATOR.className;
        li.innerHTML = GROUP_SEPARATOR.html;
        return li;
    }

    isSeparator(element) {
        return element && element.classList && element.classList.contains(GROUP_SEPARATOR.className);
    }

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

    updateActiveLinks(container) {
        const links = container.querySelectorAll(this.selectors.link);
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            if (this.isActiveLink(href)) {
                if (!link.classList.contains('active')) {
                    link.classList.add('active');
                }
            } else {
                link.classList.remove('active');
            }
        });
    }

    removeAllSeparators(container) {
        const separators = container.querySelectorAll(`.${GROUP_SEPARATOR.className}`);
        separators.forEach(sep => sep.remove());
    }

    // ===================================
    // ОБНОВЛЕНО: Сохраняем приоритетные элементы
    // ===================================
    rebuildNavigation(container) {
        // Сохраняем все приоритетные элементы перед очисткой
        const priorityItems = container.querySelectorAll('[data-priority-item="true"]');
        const savedPriorityItems = Array.from(priorityItems).map(item => {
            return {
                element: item.cloneNode(true),
                position: item.getAttribute('data-priority-position') || 'first'
            };
        });

        // Собираем все существующие элементы (кроме приоритетных)
        const existingItems = new Map();
        const links = container.querySelectorAll(this.selectors.link);
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            const li = link.parentElement;
            
            // Пропускаем приоритетные элементы
            if (!li.hasAttribute('data-priority-item')) {
                existingItems.set(href, li);
            }
        });

        // Очищаем контейнер
        container.innerHTML = '';
        
        // Добавляем приоритетные элементы в начало (position: 'first')
        savedPriorityItems
            .filter(item => item.position === 'first')
            .forEach(item => {
                container.appendChild(item.element);
            });
        
        const allGroups = Object.keys(this.config);
        
        allGroups.forEach((groupName, groupIndex) => {
            const items = this.config[groupName];
            let addedInGroup = 0;
            
            items.forEach(itemConfig => {
                if (!itemConfig.alwaysShow) return;
                
                // Пропускаем элементы, которые уже добавлены как приоритетные
                const isPriority = savedPriorityItems.some(
                    saved => saved.element.querySelector(`a[href="${itemConfig.href}"]`)
                );
                if (isPriority) {
                    //console.log(`[NavigationRestorer] Пропуск приоритетного элемента: ${itemConfig.text}`);
                    return;
                }
                
                let li;
                
                if (existingItems.has(itemConfig.href)) {
                    li = existingItems.get(itemConfig.href);
                    const a = li.querySelector('a');
                    if (a) {
                        a.textContent = itemConfig.text;
                    }
                } else {
                    li = this.createNavItem(itemConfig);
                }
                
                container.appendChild(li);
                addedInGroup++;
            });
            
            if (groupIndex < allGroups.length - 1 && addedInGroup > 0) {
                let hasNextItems = false;
                
                for (let i = groupIndex + 1; i < allGroups.length; i++) {
                    const nextGroupItems = this.config[allGroups[i]];
                    if (nextGroupItems.some(item => item.alwaysShow)) {
                        hasNextItems = true;
                        break;
                    }
                }
                
                if (hasNextItems) {
                    const separator = this.createSeparator();
                    container.appendChild(separator);
                }
            }
        });

        // Добавляем приоритетные элементы в конец (position: 'last')
        savedPriorityItems
            .filter(item => item.position === 'last')
            .forEach(item => {
                container.appendChild(item.element);
            });
    }

    restore() {
        const container = this.findNavContainer();
        
        if (!container) {
            return false;
        }
        
        this.rebuildNavigation(container);
        this.updateActiveLinks(container);
        
        // ===================================
        // НОВОЕ: После восстановления навигации вызываем PriorityNavItem
        // ===================================
        if (window.PriorityNavItem) {
            const priorityItem = new window.PriorityNavItem(
                window.PRIORITY_NAV_ITEM,
                window.NAV_SELECTORS
            );
            priorityItem.add();
        }
        
        return true;
    }

    static async init() {
        const settings = await window.SettingsStorage.getSetting(window.STORAGE_KEYS.RESTORE_NAVIGATION);
        
        if (!settings) {
            return;
        }
        
        const restorer = new NavigationRestorer(window.NAVIGATION_CONFIG, window.NAV_SELECTORS);
        
        const restored = restorer.restore();
        
        if (!restored) {
            waitForElement(restorer.selectors.container, () => {
                restorer.restore();
            });
        }
    }
}

window.NavigationRestorer = NavigationRestorer;