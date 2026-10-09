// Sends supporters to PayPal.me with the chosen amount filled in; PayPal handles the payment.
(() => {
    const PAYPAL_ME = "https://paypal.me/siddharthsuri5";
    const form = document.getElementById("pay-form");
    const input = document.getElementById("amount");
    const presets = form.querySelectorAll("[data-amount]");

    const syncPresets = () =>
        presets.forEach((b) =>
            b.setAttribute("aria-pressed", b.dataset.amount === input.value)
        );
    presets.forEach((b) =>
        b.addEventListener("click", () => {
            input.value = b.dataset.amount;
            syncPresets();
        })
    );
    input.addEventListener("input", syncPresets);
    syncPresets();

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        window.open(`${PAYPAL_ME}/${Number(input.value)}USD`, "_blank", "noopener");
    });
})();
