// Keeps the support link pointing at PayPal.me with the chosen amount. It's a real link rather
// than window.open, so popup blockers and in-app browsers don't stop it.
(() => {
    const PAYPAL_ME = "https://paypal.me/siddharthsuri5";
    const input = document.getElementById("amount");
    const link = document.getElementById("pay-link");
    const presets = document.querySelectorAll("[data-amount]");

    const sync = () => {
        link.href = `${PAYPAL_ME}/${Number(input.value)}USD`;
        presets.forEach((b) =>
            b.setAttribute("aria-pressed", b.dataset.amount === input.value)
        );
    };
    presets.forEach((b) =>
        b.addEventListener("click", () => {
            input.value = b.dataset.amount;
            sync();
        })
    );
    input.addEventListener("input", sync);
    link.addEventListener("click", (e) => {
        if (!input.reportValidity()) e.preventDefault();
    });
    sync();
})();
