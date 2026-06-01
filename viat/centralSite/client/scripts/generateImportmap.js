/*
 * Importmap generator.
 *
 * Scans the component tree and emits a browser importmap so any component can
 * be imported by a bare specifier instead of a brittle relative path:
 *
 *     import 'ui-button';            // side-effect: registers <ui-button>
 *     import { SwapPage } from 'swap-page';
 *
 * A component "adds itself" simply by calling `customElements.define('tag', …)`
 * — the generator statically parses that call (no module execution, no side
 * effects) and maps the tag → its URL. Two opt-in knobs per component:
 *
 *   static specifier = 'button';   // friendly bare name in ADDITION to the tag
 *   // @importmap-ignore           // (comment) exclude this file entirely
 *
 * The framework core is reached through the fixed `webcomponent` anchor, so the
 * scan skips components/core/ (and any dist/).
 *
 * Usage:
 *   node ./viat/centralSite/client/scripts/generateImportmap.js          # write JSON
 *   node ./viat/centralSite/client/scripts/generateImportmap.js --inject # + splice HTML
 *
 * Run via: pnpm run build:importmap
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_ROOT = join(SCRIPT_DIR, '..');
const COMPONENTS_DIR = join(CLIENT_ROOT, 'components');
const OUTPUT_FILE = join(CLIENT_ROOT, 'importmap.json');
// Framework-level specifiers that anchor every page, kept stable regardless of
// what the component scan finds. Order here is the order they appear on top.
const CORE_ANCHORS = {
	'@universalweb/utilitylib': '/scripts/utilityLibrary/index.js',
	viat: '/scripts/viat-client-sdk-bundle.js',
	webcomponent: '/components/core/index.js',
};
// Directory names the scan never descends into. `core` is the framework (the
// `webcomponent` anchor), `dist` is build output, the rest are non-source.
const SKIP_DIRS = new Set([
	'core', 'dist', 'node_modules',
]);
// HTML files whose importmap is refreshed under --inject (between markers).
const INJECT_TARGETS = [
	'index.html', 'shootout.html', 'perf.html', 'preview.html',
];
const IMPORTMAP_START = '<!-- importmap:start -->';
const IMPORTMAP_END = '<!-- importmap:end -->';
const DEFINE_PATTERN = /customElements\.define\(\s*['"]([a-z][a-z0-9-]*)['"]/g;
const SPECIFIER_PATTERN = /static\s+specifier\s*=\s*['"]([^'"]+)['"]/;
const IGNORE_PATTERN = /\/\/\s*@importmap-ignore|static\s+importmapIgnore\s*=\s*true/;
function collectJsFiles(directory, found) {
	const entries = readdirSync(directory, {
		withFileTypes: true,
	});
	for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
		const entry = entries[entryIndex];
		if (entry.isDirectory()) {
			if (!SKIP_DIRS.has(entry.name)) {
				collectJsFiles(join(directory, entry.name), found);
			}
		} else if (entry.isFile() && entry.name.endsWith('.js')) {
			found.push(join(directory, entry.name));
		}
	}
	return found;
}
function toModuleUrl(absolutePath) {
	const relativePath = relative(CLIENT_ROOT, absolutePath).split(sep).join('/');
	return `/${relativePath}`;
}
function extractTags(source) {
	const tags = [];
	DEFINE_PATTERN.lastIndex = 0;
	let match = DEFINE_PATTERN.exec(source);
	while (match) {
		tags.push(match[1]);
		match = DEFINE_PATTERN.exec(source);
	}
	return tags;
}
function scanComponents() {
	const files = collectJsFiles(COMPONENTS_DIR, []);
	const entries = new Map();
	const collisions = [];
	let ignoredCount = 0;
	for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
		const absolutePath = files[fileIndex];
		const source = readFileSync(absolutePath, 'utf8');
		if (IGNORE_PATTERN.test(source)) {
			ignoredCount++;
			continue;
		}
		const tags = extractTags(source);
		if (!tags.length) {
			continue;
		}
		const url = toModuleUrl(absolutePath);
		const specifiers = new Set(tags);
		const specifierMatch = SPECIFIER_PATTERN.exec(source);
		if (specifierMatch) {
			specifiers.add(specifierMatch[1]);
		}
		for (const specifier of specifiers) {
			const existing = entries.get(specifier);
			if (existing && existing !== url) {
				collisions.push({
					specifier,
					existing,
					incoming: url,
				});
			} else {
				entries.set(specifier, url);
			}
		}
	}
	return {
		entries,
		collisions,
		ignoredCount,
		fileCount: files.length,
	};
}
function buildImports(entries) {
	const imports = {
		...CORE_ANCHORS,
	};
	const componentKeys = [...entries.keys()].sort();
	for (let keyIndex = 0; keyIndex < componentKeys.length; keyIndex++) {
		const key = componentKeys[keyIndex];
		if (!(key in imports)) {
			imports[key] = entries.get(key);
		}
	}
	return imports;
}
function prefixTab(line) {
	return `\t\t${line}`;
}
function renderImportmapScript(imports) {
	const body = JSON.stringify({
		imports,
	}, null, '\t');
	const indented = body.split('\n').map(prefixTab).join('\n');
	return `${IMPORTMAP_START}\n\t\t<script type="importmap">\n${indented}\n\t\t</script>\n\t\t${IMPORTMAP_END}`;
}
function injectIntoHtml(imports) {
	const block = renderImportmapScript(imports);
	const updated = [];
	const skipped = [];
	for (let targetIndex = 0; targetIndex < INJECT_TARGETS.length; targetIndex++) {
		const htmlPath = join(CLIENT_ROOT, INJECT_TARGETS[targetIndex]);
		if (!existsSync(htmlPath)) {
			continue;
		}
		const html = readFileSync(htmlPath, 'utf8');
		const startAt = html.indexOf(IMPORTMAP_START);
		const endAt = html.indexOf(IMPORTMAP_END);
		if (startAt === -1 || endAt === -1 || endAt < startAt) {
			skipped.push(INJECT_TARGETS[targetIndex]);
			continue;
		}
		const next = html.slice(0, startAt) + block + html.slice(endAt + IMPORTMAP_END.length);
		writeFileSync(htmlPath, next);
		updated.push(INJECT_TARGETS[targetIndex]);
	}
	return {
		updated,
		skipped,
	};
}
function run() {
	const shouldInject = process.argv.includes('--inject');
	const scan = scanComponents();
	const imports = buildImports(scan.entries);
	const componentCount = Object.keys(imports).length - Object.keys(CORE_ANCHORS).length;
	writeFileSync(OUTPUT_FILE, `${JSON.stringify({
		imports,
	}, null, '\t')}\n`);
	console.log(`[importmap] scanned ${scan.fileCount} files → ${componentCount} component specifiers (+${Object.keys(CORE_ANCHORS).length} anchors)`);
	console.log(`[importmap] wrote ${toModuleUrl(OUTPUT_FILE)}`);
	if (scan.ignoredCount) {
		console.log(`[importmap] ${scan.ignoredCount} file(s) opted out via @importmap-ignore`);
	}
	if (scan.collisions.length) {
		console.warn(`[importmap] ${scan.collisions.length} specifier collision(s) — first URL kept:`);
		for (let collisionIndex = 0; collisionIndex < scan.collisions.length; collisionIndex++) {
			const collision = scan.collisions[collisionIndex];
			console.warn(`  "${collision.specifier}": kept ${collision.existing}, ignored ${collision.incoming}`);
		}
	}
	if (shouldInject) {
		const injection = injectIntoHtml(imports);
		if (injection.updated.length) {
			console.log(`[importmap] injected importmap into: ${injection.updated.join(', ')}`);
		}
		if (injection.skipped.length) {
			console.warn(`[importmap] no ${IMPORTMAP_START} … ${IMPORTMAP_END} markers in: ${injection.skipped.join(', ')} (skipped)`);
		}
	}
}
run();
