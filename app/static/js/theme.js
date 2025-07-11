const THEME_KEY = 'site-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

function setTheme(theme) {
    const body = document.querySelector('body');
    const themeIcon = document.getElementById('themeIcon');
    const themeToggle = document.getElementById('themeToggle');

    if (theme === LIGHT_THEME) {
        body.setAttribute('data-bs-theme', 'light');
        body.classList.remove('bg-dark', 'text-light');
        body.classList.add('bg-light', 'text-dark');
        if (themeIcon) {
            themeIcon.textContent = 'dark_mode';
        }
        if (themeToggle) {
            themeToggle.classList.remove('btn-outline-light');
            themeToggle.classList.add('btn-outline-dark');
        }
    } else {
        body.setAttribute('data-bs-theme', 'dark');
        body.classList.remove('bg-light', 'text-dark');
        body.classList.add('bg-dark', 'text-light');
        if (themeIcon) {
            themeIcon.textContent = 'light_mode';
        }
        if (themeToggle) {
            themeToggle.classList.remove('btn-outline-dark');
            themeToggle.classList.add('btn-outline-light');
        }
    }
    localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem(THEME_KEY) || DARK_THEME;
    const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    setTheme(newTheme);
}

// Initialize theme from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem(THEME_KEY) || DARK_THEME;
    setTheme(savedTheme);
});
