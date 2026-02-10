// ============================================================
// ФАЙЛ: src/teamPageExtension.js
// Создай новый файл src/teamPageExtension.js и скопируй этот код
// ============================================================

// Конфигурация дополнительного члена команды
const TEAM_MEMBER_CONFIG = {
    name: 'Безымянный',
    nickname: 'relder1',
    profileUrl: 'https://jut.su/user/relder1/',
    telegramUrl: 'https://t.me/relder1', // замени на реальную ссылку
    hasTelegram: true // установи false, если телеграм не нужен
};

// Класс для управления добавлением члена команды
class TeamPageExtension {
    constructor(config) {
        this.config = config;
        this.currentPath = window.location.pathname;
    }

    // Проверить, находимся ли мы на странице команды
    isTeamPage() {
        return this.currentPath === '/team/' || this.currentPath === '/team';
    }

    // Найти список команды
    findTeamList() {
        return document.querySelector('.team_list');
    }

    // Проверить, существует ли уже элемент с этим никнеймом
    memberExists(teamList) {
        const links = teamList.querySelectorAll('.pm_list');
        for (let link of links) {
            const onclick = link.getAttribute('onclick');
            if (onclick && onclick.includes(this.config.nickname)) {
                return true;
            }
        }
        return false;
    }

    // Создать элемент списка для члена команды
    createTeamMemberElement() {
        const li = document.createElement('li');
        li.setAttribute('data-team-extension', 'true');
        li.setAttribute('title', "Разработчик расширения Jut.su Extended");

        // Первая строка: имя и никнейм
        const nameDiv = document.createElement('div');
        nameDiv.setAttribute('bis_skin_checked', '1');
        nameDiv.innerHTML = `${this.config.name} (<b style="color: red;">${this.config.nickname}</b>)`;

        // Вторая строка: ссылки
        const linksDiv = document.createElement('div');
        linksDiv.setAttribute('bis_skin_checked', '1');

        // Ссылка на профиль
        const profileLink = document.createElement('a');
        profileLink.className = 'pm_list';
        profileLink.href = this.config.profileUrl;
        profileLink.setAttribute('bis_skin_checked', '1');
        profileLink.textContent = 'профиль на сайте';
        
        // Добавляем onclick для ShowProfile
        const encodedNickname = encodeURIComponent(this.config.nickname);
        profileLink.setAttribute('onclick', 
            `ShowProfile('${encodedNickname}', '${this.config.profileUrl}', ''); return false;`
        );

        linksDiv.appendChild(profileLink);

        // Добавляем телеграм, если нужен
        if (this.config.hasTelegram && this.config.telegramUrl) {
            const separator = document.createTextNode(' | ');
            linksDiv.appendChild(separator);

            const telegramLink = document.createElement('a');
            telegramLink.href = this.config.telegramUrl;
            telegramLink.target = '_blank';
            telegramLink.setAttribute('bis_skin_checked', '1');
            telegramLink.textContent = 'Telegram-аккаунт';
            linksDiv.appendChild(telegramLink);
        } else {
            const separator = document.createTextNode(' | Telegram-аккаунт');
            linksDiv.appendChild(separator);
        }

        li.appendChild(nameDiv);
        li.appendChild(linksDiv);

        return li;
    }

    // Добавить члена команды в список
    addTeamMember() {
        if (!this.isTeamPage()) {
            //console.log('[TeamPageExtension] Не на странице команды');
            return false;
        }

        const teamList = this.findTeamList();
        
        if (!teamList) {
            //console.warn('[TeamPageExtension] Список команды не найден');
            return false;
        }

        // Проверяем, не добавлен ли уже этот член команды
        if (this.memberExists(teamList)) {
            //console.log('[TeamPageExtension] Член команды уже существует');
            return true;
        }

        // Создаём и добавляем новый элемент
        const newMember = this.createTeamMemberElement();
        teamList.appendChild(newMember);
        
        //console.log('[TeamPageExtension] Член команды добавлен:', this.config.nickname);
        return true;
    }

    // Инициализация с ожиданием загрузки DOM
    static async init() {
        const extension = new TeamPageExtension(TEAM_MEMBER_CONFIG);
        
        // Проверяем, нужно ли вообще что-то делать
        if (!extension.isTeamPage()) {
            return;
        }

        // Пытаемся добавить сразу
        const added = extension.addTeamMember();
        
        // Если не получилось, ждём появления списка
        if (!added) {
            waitForElement('.team_list', () => {
                extension.addTeamMember();
            });
        }
    }
}

// Экспортируем в глобальную область
window.TeamPageExtension = TeamPageExtension;
window.TEAM_MEMBER_CONFIG = TEAM_MEMBER_CONFIG;

// Автоматический запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        TeamPageExtension.init();
    });
} else {
    TeamPageExtension.init();
}