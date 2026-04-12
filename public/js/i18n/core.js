import { translations } from './translations.js';

class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('debugai_lang') || this.detectLanguage();
        this.fallbackLang = 'en';
        document.documentElement.lang = this.currentLang;
        this.init();
    }

    init() {
        // Observer to handle dynamic content if needed in the future
        // For now, manual updateUI is enough for this app structure
    }

    detectLanguage() {
        const lang = navigator.language || navigator.userLanguage;
        return lang.startsWith('es') ? 'es' : 'en';
    }

    t(path, variables = {}) {
        const keys = path.split('.');
        let translation = this.getNestedValue(translations[this.currentLang], keys);

        // Fallback to English if not found
        if (!translation && this.currentLang !== this.fallbackLang) {
            translation = this.getNestedValue(translations[this.fallbackLang], keys);
        }

        if (!translation) return path;

        // Replace variables
        Object.keys(variables).forEach(key => {
            translation = translation.replace(`{${key}}`, variables[key]);
        });

        return translation;
    }

    getNestedValue(obj, keys) {
        return keys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : null, obj);
    }

    updateUI() {
        // [1] Handle simple data-i18n (innerText)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const path = el.getAttribute('data-i18n');
            const varsAttr = el.getAttribute('data-i18n-vars');
            const vars = varsAttr ? JSON.parse(varsAttr) : {};
            
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = this.t(path, vars);
            } else {
                el.innerText = this.t(path, vars);
            }
        });

        // [2] Handle attributes data-i18n-attr="attr:path,attr2:path2"
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const attrConfig = el.getAttribute('data-i18n-attr');
            attrConfig.split(',').forEach(pair => {
                const [attr, path] = pair.split(':').map(s => s.trim());
                if (attr && path) {
                    el.setAttribute(attr, this.t(path));
                }
            });
        });

        // [3] Update Language Selectors UI
        this.syncLanguageSelectors();

        window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: this.currentLang } }));
    }

    syncLanguageSelectors() {
        const labels = document.querySelectorAll('.current-lang-label');
        labels.forEach(lb => {
            lb.innerText = this.currentLang.toUpperCase();
        });
    }

    toggleDropdown() {
        const dropdown = document.querySelector('.lang-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display === 'flex';
            dropdown.style.display = isVisible ? 'none' : 'flex';
        }
    }

    async setLanguage(lang) {
        if (lang === this.currentLang) return;
        this.currentLang = lang;
        localStorage.setItem('debugai_lang', lang);
        document.documentElement.lang = lang;
        this.updateUI();
        
        // Auto-close dropdown
        const dropdown = document.querySelector('.lang-dropdown');
        if (dropdown) dropdown.style.display = 'none';
        
        console.log(`[i18n] Language changed to: ${lang}`);
    }
}

const i18n = new I18nManager();
window.i18n = i18n;
window.t = (path, vars) => i18n.t(path, vars);

// Global click handler to close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const selector = e.target.closest('.lang-selector');
    if (!selector) {
        const dropdown = document.querySelector('.lang-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    i18n.updateUI();
});

export default i18n;
