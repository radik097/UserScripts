
// ============================================================
// ФАЙЛ: src/navigationConfig.js
// Создай новый файл src/navigationConfig.js и скопируй этот код
// ============================================================

// Конфигурация элементов навигации, которые должны быть на сайте
const NAVIGATION_CONFIG = {
    // Основные разделы (всегда должны быть)
    main: [
        { href: '/anime/', text: 'Аниме', alwaysShow: true },
        { href: '/new/', text: 'Новости', alwaysShow: true },
        { href: '/forum/', text: 'Форум', alwaysShow: true },
        { href: '/wiki/', text: 'Нарутопедия', alwaysShow: true }
    ],
    
    // Контент
    content: [
        { href: '/naruuto/', text: 'Смотреть Наруто', alwaysShow: true },
        { href: '/manga/', text: 'Манга Наруто', alwaysShow: true },
        { href: '/novels/', text: 'Новеллы Наруто', alwaysShow: true },
        { href: '/stories/', text: 'Видео-истории', alwaysShow: true },
        { href: '/reviews/', text: 'Видео-обзоры', alwaysShow: true },
        { href: '/podcasts/', text: 'Аудио-подкасты', alwaysShow: true }
    ],
    
    // Справочная информация
    reference: [
        { href: '/ninja/', text: 'Все герои', alwaysShow: true },
        { href: '/by-episodes/', text: 'Список техник', alwaysShow: true },
        { href: '/calendar/', text: 'Календарь Дней Рождений', alwaysShow: true },
        { href: '/seals/', text: 'Ручные печати', alwaysShow: true },
        { href: '/tests/', text: 'Тесты', alwaysShow: true }
    ],
    
    // Дополнительные разделы
    additional: [
        { href: '/jobs/', text: 'Вакансии', alwaysShow: true },
        { href: '/study/', text: 'Обучение озвучки', alwaysShow: true },
        { href: '/mail/', text: 'Аниме почта', alwaysShow: true },
        { href: '/subscription/', text: 'Оповещения ВК и TG', alwaysShow: true },
        { href: '/news/', text: 'Наши новости', alwaysShow: true },
        { href: '/team/', text: 'Команда сайта', alwaysShow: true },
        { href: '/partners/', text: 'Партнерам сайта', alwaysShow: true },
        { href: '/feedback.html', text: 'Наши контакты', alwaysShow: true }
    ]
};

// Класс разделителя групп
const GROUP_SEPARATOR = {
    tag: 'li',
    className: 'snl_group_last',
    html: '<span></span>'
};

// Селекторы для поиска навигации
const NAV_SELECTORS = {
    container: '.widget .site_nav_l',
    widgetTitle: '.b-b-g-title',
    link: 'a'
};

window.NAVIGATION_CONFIG = NAVIGATION_CONFIG;
window.GROUP_SEPARATOR = GROUP_SEPARATOR;
window.NAV_SELECTORS = NAV_SELECTORS;
