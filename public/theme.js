// Follows the system light/dark setting until a theme is picked, then remembers the pick.
(() => {
    const root = document.documentElement;
    const system = matchMedia("(prefers-color-scheme: dark)");
    const systemTheme = () => (system.matches ? "dark" : "light");
    let saved = null;
    try {
        saved = localStorage.getItem("theme");
    } catch {}
    if (!["light", "reader", "dark"].includes(saved)) saved = null;
    root.dataset.theme = saved || systemTheme();

    document.addEventListener("DOMContentLoaded", () => {
        const buttons = document.querySelectorAll("[data-set-theme]");
        const set = (theme) => {
            root.dataset.theme = theme;
            buttons.forEach((b) =>
                b.setAttribute("aria-pressed", b.dataset.setTheme === theme)
            );
        };
        const fade = (theme) =>
            document.startViewTransition
                ? document.startViewTransition(() => set(theme))
                : set(theme);

        buttons.forEach((b) =>
            b.addEventListener("click", () => {
                saved = b.dataset.setTheme;
                try {
                    localStorage.setItem("theme", saved);
                } catch {}
                fade(saved);
            })
        );
        system.addEventListener("change", () => {
            if (!saved) fade(systemTheme());
        });
        set(root.dataset.theme);
    });
})();
