// modules/settings.js (设置模块)

import { showMessage, on, off } from '../utils.js';

function initializeSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const fontSizeSelect = document.getElementById('fontSize');
    const highContrastCheckbox = document.getElementById('highContrast');
    const themeSelect = document.getElementById('theme');

    on(settingsBtn, 'click', () => {
        settingsPanel.classList.add('active');
    });

    on(closeSettingsBtn, 'click', () => {
        settingsPanel.classList.remove('active');
    });

    on(fontSizeSelect, 'change', saveSettings);
    on(highContrastCheckbox, 'change', saveSettings);
    on(themeSelect, 'change', saveSettings)

    loadSavedSettings();
}

function loadSavedSettings() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');

    if (settings.fontSize) {
        document.getElementById('fontSize').value = settings.fontSize;
        applyFontSize(settings.fontSize);
    }
    if (settings.highContrast) {
        document.getElementById('highContrast').checked = settings.highContrast;
        applyHighContrast(settings.highContrast);
    }
    if (settings.theme) {
        document.getElementById('theme').value = settings.theme;
        applyTheme(settings.theme);
    }
}

function saveSettings() {
    const settings = {
        fontSize: document.getElementById('fontSize').value,
        highContrast: document.getElementById('highContrast').checked,
        theme: document.getElementById('theme').value,
    };

    localStorage.setItem('settings', JSON.stringify(settings));

    applyFontSize(settings.fontSize);
    applyHighContrast(settings.highContrast);
    applyTheme(settings.theme);

    showMessage('设置已保存', 'success');
}

function applyFontSize(size) {
    const sizes = {
        'small': '14px',
        'medium': '16px',
        'large': '18px',
        'extra-large': '20px',
    };
    document.body.style.fontSize = sizes[size] || '16px';
}

function applyHighContrast(enabled) {
    if (enabled) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }
}

function applyTheme(theme) {
    document.body.classList.remove('dark-theme', 'warm-theme'); // 移除其他主题
    if (theme !== 'light') {
        document.body.classList.add(`${theme}-theme`);
    }
}

export { initializeSettings };