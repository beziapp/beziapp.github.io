const THEME_COLOR_SCHEMES = {
    light: {
        "color-primary": "rgba(0, 128, 83, 1)",
        "color-secondary": "rgba(0, 77, 50, 1)",
        "color-accent": "rgba(0, 156, 101, 1)",
        "color-primary-light": "rgba(230, 250, 231, 1)",
        "color-invalid": "rgba(192, 0, 0, 1)",
        "background-color": "rgba(255, 255, 255, 1)",
        "background-accent": "rgba(0, 156, 101, 0.2)"
    },
    dark: {
        "color-primary": "rgba(0, 128, 83, 1)",
        "color-secondary": "rgba(0, 94, 61, 1)",
        "color-accent": "rgba(20, 117, 83, 1)",
        "color-primary-light": "rgba(230, 250, 231, 1)",
        "color-invalid": "rgba(192, 0, 0, 1)",
        "background-color": "rgba(31, 31, 31, 1)",
        "background-accent": "rgba(0, 92, 44, 0.2)"
    }
}

function applyTheme(themeName) {
    for (const [property, value] of Object.entries(THEME_COLOR_SCHEMES[themeName])) {
        document.documentElement.style.setProperty(`--${property}`, value);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    localforage.getItem("theme").then((selectedTheme) => {
        if (selectedTheme == null) {
            let isOsDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(isOsDarkTheme ? "dark" : "light");
        } else {
            applyTheme(selectedTheme);
        }
    });
});