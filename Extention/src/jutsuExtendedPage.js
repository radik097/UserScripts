// ============================================================
// ФАЙЛ: src/jutsuExtendedPage.js
// Создай новый файл src/jutsuExtendedPage.js и скопируй этот код
// ============================================================

// Конфигурация HTML контента для страницы Jut.su Extended
const JUTSU_EXTENDED_HTML = `

<div class="siteteam2">
    <h1 class="b-b-title center">Jut.su Extended</h1>
    <div class="extended-content">
        <p>Этот раздел не является разделом сайта Jut.su, этот раздел расширения Jut.su Extended в котором описано некие подробности о работе расширения.</p>
        
        <h2>Возможности расширения</h2>
        <p>Я не буду по 200 раз писать одно и тоже, возможности кратко описаны на <a href="https://chromewebstore.google.com/detail/jutsu-extended/cibimdekkplbcgmlpahiejlhfiimgjah" target="_blank">странице расширения в Chrome Web Store</a>, так же более подробные описания в всплывающем окне расширения.</p>
    </div>
</div>

`;

// Класс для управления кастомной страницей Jut.su Extended
class JutsuExtendedPage {
    constructor(customHtml) {
        this.customHtml = customHtml;
        this.currentPath = window.location.pathname;
    }

    // Проверить, находимся ли мы на странице jutsuextended
    isExtendedPage() {
        const path = this.currentPath;
        const isExtended = path === '/jutsuextended/' || path === '/jutsuextended';
        //console.log('[JutsuExtendedPage] Проверка пути:', path, '-> isExtended:', isExtended);
        return isExtended;
    }

    // Найти контейнер контента
    findContentContainer() {
        const container = document.querySelector('.content');
        //console.log('[JutsuExtendedPage] Поиск .content:', container ? 'найден' : 'не найден');
        return container;
    }

    // Проверить, уже ли заменён контент
    isContentReplaced(container) {
        return container.hasAttribute('data-extended-replaced');
    }

    // Очистить контейнер от дефолтного содержимого
    clearDefaultContent(container) {
        // Удаляем все дочерние элементы
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        //console.log('[JutsuExtendedPage] Дефолтный контент очищен');
    }

    // Вставить кастомный HTML
    insertCustomHtml(container) {
        // Создаём временный элемент для парсинга HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.customHtml.trim();

        // Переносим все элементы из временного div в контейнер
        while (tempDiv.firstChild) {
            container.appendChild(tempDiv.firstChild);
        }

        // Помечаем контейнер как замещённый
        container.setAttribute('data-extended-replaced', 'true');
        //console.log('[JutsuExtendedPage] Кастомный HTML вставлен');
    }

    // Заменить контент страницы
    replaceContent() {
        if (!this.isExtendedPage()) {
            //console.log('[JutsuExtendedPage] Не на странице jutsuextended');
            return false;
        }

        const container = this.findContentContainer();
        
        if (!container) {
            //console.warn('[JutsuExtendedPage] Контейнер контента не найден');
            return false;
        }

        // Проверяем, не заменён ли уже контент
        if (this.isContentReplaced(container)) {
            //console.log('[JutsuExtendedPage] Контент уже заменён');
            return true;
        }

        // Очищаем дефолтный контент
        this.clearDefaultContent(container);

        // Вставляем кастомный HTML
        this.insertCustomHtml(container);

        //console.log('[JutsuExtendedPage] Замена контента выполнена успешно');
        return true;
    }

    // Инициализация с ожиданием загрузки DOM
    static async init() {
        const page = new JutsuExtendedPage(JUTSU_EXTENDED_HTML);
        
        // Проверяем, нужно ли вообще что-то делать
        if (!page.isExtendedPage()) {
            return;
        }

        //console.log('[JutsuExtendedPage] Инициализация...');

        // Пытаемся заменить сразу
        const replaced = page.replaceContent();
        
        // Если не получилось, ждём появления контейнера
        if (!replaced) {
            //console.log('[JutsuExtendedPage] Ожидание появления контейнера...');
            waitForElement('.content', () => {
                page.replaceContent();
            });
        }
    }
}

// Экспортируем в глобальную область
window.JutsuExtendedPage = JutsuExtendedPage;
window.JUTSU_EXTENDED_HTML = JUTSU_EXTENDED_HTML;

// Автоматический запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        JutsuExtendedPage.init();
    });
} else {
    JutsuExtendedPage.init();
}