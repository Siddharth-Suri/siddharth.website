// ASCII scene: a still landscape of mountains and trees, with clouds drifting above.
// The clouds glide with a CSS animation, so nothing redraws per frame.
(() => {
    const sky = document.getElementById("sky");
    const land = document.getElementById("land");
    const SKY_ROWS = 5;
    const LAND_ROWS = 10;

    const CLOUDS = [
        ["   .--.", ".-(    ).", "(___.__)__)"],
        ["   .-~~-.", " .(      ).", "(__________)"],
        ["  .--..-.", " (_______)"],
        [" .-.", "(___)"],
    ];
    const TREES = [
        ["   ^", "  ^^^", " ^^^^^", "^^^^^^^", "   |"],
        ["  ^", " ^^^", "^^^^^", "  |"],
        ["  .-.", " (   )", "(     )", " `-|-'", "   |"],
    ];

    // Seeded so the scene looks the same on every visit.
    const random = (seed) => () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const drawLand = (cols) => {
        const rng = random(7);
        const grid = Array.from({ length: LAND_ROWS }, () =>
            Array(cols).fill(" ")
        );
        const at = (level, x, ch) => {
            grid[LAND_ROWS - 1 - level][x] = ch;
        };

        // Mountain range: the outline of overlapping triangular peaks.
        const peaks = [];
        for (
            let x = Math.floor(rng() * 10);
            x < cols + 8;
            x += 16 + Math.floor(rng() * 16)
        ) {
            peaks.push([x, 5 + Math.floor(rng() * 4)]);
        }
        const height = (x) =>
            Math.max(1, ...peaks.map(([px, h]) => h - Math.abs(x - px)));
        for (let x = 0; x < cols; x++) {
            const a = height(x),
                b = height(x + 1);
            if (b > a) at(a, x, "/");
            else if (b < a) at(b, x, "\\");
            else if (a > 1) at(a, x, "_");
        }

        // Trees grow in small groves on the open ground between mountains.
        const open = (from, to) => {
            for (let i = from; i <= to; i++) if (height(i) > 2) return false;
            return true;
        };
        for (let x = 1; x < cols; ) {
            const tree = TREES[Math.floor(rng() * TREES.length)];
            const width = Math.max(...tree.map((row) => row.length));
            if (x + width > cols || !open(x - 1, x + width) || rng() >= 0.6) {
                x++;
                continue;
            }
            tree.forEach((row, dy) => {
                for (let i = row.search(/\S/); i < row.length; i++)
                    grid[LAND_ROWS - 1 - tree.length + dy][x + i] = row[i];
            });
            x += width + 1;
        }

        for (let x = 0; x < cols; x++) {
            const r = rng();
            at(0, x, r < 0.12 ? "," : r < 0.22 ? "." : r < 0.27 ? "'" : "_");
        }

        land.textContent = grid.map((row) => row.join("")).join("\n");
    };

    const drawSky = (cols) => {
        const rng = random(11);
        const count = Math.max(2, Math.round(cols / 25));
        sky.replaceChildren(
            ...Array.from({ length: count }, (_, i) => {
                const sprite = CLOUDS[i % CLOUDS.length];
                const duration = 60 + rng() * 40;
                const cloud = document.createElement("pre");
                cloud.className = "cloud";
                cloud.textContent = sprite.join("\n");
                cloud.style.setProperty(
                    "--row",
                    Math.floor(rng() * (SKY_ROWS - sprite.length + 1))
                );
                cloud.style.animationDuration = `${duration}s`;
                cloud.style.animationDelay = `${
                    -((i + rng() * 0.5) / count) * duration
                }s`;
                return cloud;
            })
        );
    };

    let cols = 0;
    new ResizeObserver(() => {
        const probe = document.createElement("span");
        probe.textContent = "x".repeat(50);
        land.append(probe);
        const width = Math.floor(
            land.clientWidth / (probe.getBoundingClientRect().width / 50)
        );
        probe.remove();
        if (width === cols) return;
        cols = width;
        drawLand(cols);
        drawSky(cols);
    }).observe(land);
})();
