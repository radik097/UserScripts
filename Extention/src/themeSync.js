class ThemeSync {
    constructor() {
        this.observers = [];
        this.currentTheme = this.detectTheme();
    }

    detectTheme() {
        return document.body.classList.contains('dark_mode') ? 'dark' : 'light';
    }

    isDarkTheme(theme = this.currentTheme) {
        return theme === 'dark';
    }

    addObserver(callback) {
        if (typeof callback === 'function') {
            this.observers.push(callback);

            // 🔥 сразу уведомляем о текущей теме
            callback(this.currentTheme, this.isDarkTheme());
        }
    }

    notifyObservers(theme) {
        this.observers.forEach(cb => {
            try {
                cb(theme, theme === 'dark');
            } catch (e) {
                //console.error('[ThemeSync]', e);
            }
        });
    }

    startWatching() {
        const observer = new MutationObserver(() => {
            const newTheme = this.detectTheme();

            if (newTheme !== this.currentTheme) {
                //console.log(`[ThemeSync] ${this.currentTheme} → ${newTheme}`);
                this.currentTheme = newTheme;
                this.notifyObservers(newTheme);
            }
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    static init() {
        const themeSync = new ThemeSync();

        themeSync.addObserver(() => {
            themeSync.updateAchievementsTheme();
        });

        themeSync.startWatching();
        window.ThemeSync = themeSync;
    }

    updateAchievementsTheme() {
        if (typeof updateAchievementCardsTheme === 'function') {
            updateAchievementCardsTheme(this.currentTheme);
        }
        if (typeof updateRendererTheme === 'function') {
            updateRendererTheme(this.currentTheme);
        }
        if (
            document.querySelector('#achievementsModal') &&
            typeof updateAchievementsModalTheme === 'function'
        ) {
            updateAchievementsModalTheme(this.currentTheme);
        }
    }
}
