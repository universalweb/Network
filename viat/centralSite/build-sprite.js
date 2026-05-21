// build-sprite.js — generate the SVG icon sprite for the centralSite client.
//
// Reads every Lucide SVG and bakes them into a single <symbol> sprite at
//   client/components/global/icon/sprite.svg
// which the <ui-icon> component consumes via <use href="sprite.svg#name">.
//
// This is a manual, dev-time build tool — NOT runtime or server code. Run it
// after adding new icons or upgrading the `lucide-static` package:
//   node viat/centralSite/build-sprite.js
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// This script lives at <repo>/viat/centralSite/ — two levels below the repo root.
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const lucideIconsDir = join(repoRoot, 'node_modules/lucide-static/icons');
const outputPath = join(here, 'client/components/global/icon/sprite.svg');
const innerRe = /<svg[^>]*>([\s\S]*?)<\/svg>/;
function extractInner(svgText) {
	const match = svgText.match(innerRe);
	return match ? match[1].trim() : '';
}
async function main() {
	const files = (await readdir(lucideIconsDir)).filter((name) => {
		return name.endsWith('.svg');
	}).sort();
	const symbols = [];
	let count = 0;
	for (const file of files) {
		const name = file.slice(0, -4);
		const text = await readFile(join(lucideIconsDir, file), 'utf8');
		const inner = extractInner(text);
		if (!inner) {
			continue;
		}
		symbols.push(`<symbol id="${name}" viewBox="0 0 24 24">${inner}</symbol>`);
		count += 1;
	}
	const sprite = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">${symbols.join('')}</svg>`;
	await writeFile(outputPath, sprite, 'utf8');
	console.log(`wrote ${count} icons → ${outputPath}`);
	console.log(`sprite size: ${(sprite.length / 1024).toFixed(1)} KB`);
}
main().catch((error) => {
	console.error(error);
	process.exit(1);
});
