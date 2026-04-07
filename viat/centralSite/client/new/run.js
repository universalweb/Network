const fs = require('fs');
const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/font-size:\s*(\d+)px;/g, (m, px) => {
    return 'font-size: ' + (parseInt(px, 10) / 16) + 'rem;';
});

if (!content.includes('html {')) {
    content = content.replace('/* ── Reset ─────────────────────────────────────────── */',
    "/* ── Reset ─────────────────────────────────────────── */\n\t\t\thtml {\n\t\t\t\tfont-size: clamp(12px, 0.8vw + 6px, 24px);\n\t\t\t}\n");
}

fs.writeFileSync(file, content);
