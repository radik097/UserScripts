
// ============================================================
// ФАЙЛ: src/panelManager.js
// ============================================================

class AchievementsPanelManager {
    constructor(panel, overlay, colors) {
        this.panel = panel;
        this.overlay = overlay;
        this.colors = colors;
        this.achievementsLoaded = false;
    }

    close() {
        this.panel.style.display = 'none';
        this.overlay.style.display = 'none';
    }

    open() {
        this.panel.style.display = 'block';
        this.overlay.style.display = 'block';
    }

    toggle() {
        const isVisible = this.panel.style.display === 'block';
        if (isVisible) {
            this.close();
        } else {
            if (!this.achievementsLoaded) {
                this.loadAchievements();
                this.achievementsLoaded = true;
            }
            this.open();
        }
    }

    loadAchievements() {
        try {
            const achievements = parseAchievements();

            this.panel.innerHTML = '';
            this.panel.appendChild(createPanelHeader(this.colors, () => this.close()));

            const contentDiv = renderAchievementsList(achievements, this.colors);

            this.panel.appendChild(contentDiv);
            this.panel.appendChild(createSupportButton(this.colors, SUPPORT_LINK));

        } catch (error) {
            //console.error('Ошибка при загрузке достижений:', error);

            this.panel.innerHTML = '';
            this.panel.appendChild(createPanelHeader(this.colors, () => this.close()));
            this.panel.appendChild(renderError(this.colors));
            this.panel.appendChild(createSupportButton(this.colors, SUPPORT_LINK));
        }
    }
}

