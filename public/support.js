(() => {
    const form = document.getElementById("pay-form");
    const input = document.getElementById("amount");
    const submit = form.querySelector("[type=submit]");
    const status = document.getElementById("status");
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

    // Razorpay's checkout is loaded only when someone clicks "support": once loaded, its hidden
    // frame keeps pre-downloading hundreds of files, so it's torn down again when checkout closes.
    const CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";
    let checkoutScript = null;
    const loadCheckout = () =>
        (checkoutScript ??= new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = CHECKOUT_URL;
            script.onload = resolve;
            script.onerror = () => {
                checkoutScript = null;
                unloadCheckout();
                reject(
                    new Error(
                        "Checkout couldn't load. Disable any content blocker for this page and try again."
                    )
                );
            };
            document.head.append(script);
        }));
    // Deferred so Razorpay can finish its own close animation before its elements disappear;
    // reopening checkout cancels a pending teardown.
    let unloadTimer;
    const unloadCheckout = () => {
        clearTimeout(unloadTimer);
        unloadTimer = setTimeout(() => {
            document
                .querySelectorAll(
                    'script[src*="razorpay.com"], .razorpay-container, iframe[src*="razorpay.com"]'
                )
                .forEach((el) => el.remove());
            checkoutScript = null;
        }, 1000);
    };

    const post = async (url, body) => {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
            throw new Error(
                data.error || "Something went wrong. Please try again."
            );
        return data;
    };

    const verify = async (payment) => {
        status.textContent = "Confirming payment…";
        try {
            await post("/api/verify", payment);
            status.textContent = "Thank you! Your support means a lot.";
        } catch (err) {
            status.textContent = `${err.message} If you were charged, please email me.`;
        }
        unloadCheckout();
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearTimeout(unloadTimer);
        submit.disabled = true;
        status.textContent = "Opening checkout…";
        try {
            const [order] = await Promise.all([
                post("/api/order", { amount: Number(input.value) }),
                loadCheckout(),
            ]);
            const checkout = new Razorpay({
                key: order.key,
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                name: "Siddharth Suri",
                description: "Support my projects",
                theme: {
                    color: getComputedStyle(document.documentElement)
                        .getPropertyValue("--accent")
                        .trim(),
                },
                handler: verify,
                modal: {
                    ondismiss: () => {
                        if (status.textContent === "Opening checkout…")
                            status.textContent = "";
                        unloadCheckout();
                    },
                },
            });
            checkout.on("payment.failed", ({ error }) => {
                status.textContent = `Payment failed: ${error.description} You can try again.`;
            });
            checkout.open();
        } catch (err) {
            status.textContent = err.message;
            unloadCheckout();
        } finally {
            submit.disabled = false;
        }
    });
})();
