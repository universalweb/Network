/*
	Importmap generator.

	Scans the component tree and emits a browser importmap so any component can
	be imported by a bare specifier instead of a brittle relative path:

	    import 'ui-button';            // side-effect: registers <ui-button>
	    import { SwapPage } from 'swap-page';

	A component "adds itself" simply by calling `customElements.define('tag', …)`
	— the generator statically parses that call (no module execution, no side
	effects) and maps the tag → its URL.

	Rooted tags (`ui-*`, `user-*`) use the SAME path math as the runtime
	resolver (`components/core/resolver.js` → `resolveTagUrl`). Scan only
	discovers which tags exist; the URL is the convention path so the importmap
	cannot drift from auto-resolve. Non-rooted tags keep the scanned file URL.

	Opt-in knobs per component:
	  static specifier = 'button';   // friendly bare name IN ADDITION to the tag
	  // @importmap-ignore           // exclude this file entirely

	Framework core is the fixed `webcomponent` anchor; scan skips components/core/
	(and any dist/).

	Usage:
	  node ./viat/centralSite/generateImportmap.js           # write JSON
	  node ./viat/centralSite/generateImportmap.js --inject  # + splice HTML
	  node ./viat/centralSite/generateImportmap.js --strict  # exit 1 on path drift

	Run via: pnpm run build:importmap
*/
import {
	readdirSync, readFileSync, writeFileSync, existsSync,
} from 'node:fs';
import {
	join, relative, sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_ROOT = join(SCRIPT_DIR, 'client');
const COMPONENTS_DIR = join(CLIENT_ROOT, 'components');
const OUTPUT_FILE = join(CLIENT_ROOT, 'importmap.json');

/*
	Site-relative bases — mirrors registerRoots.js:
	  registerRoot('ui', …/components/global/)
	  registerRoot('user', …/components/user/)
	Path math must stay in lockstep with resolveTagUrl in resolver.js.
*/
const ROOT_BASES = {
	ui: '/components/global',
	user: '/components/user',
};

const CORE_ANCHORS = {
	'@universalweb/utilitylib': '/scripts/utilityLibrary/index.js',
	viat: '/scripts/viat-client-sdk-bundle.js',
	webcomponent: '/components/core/index.js',
};

const SKIP_DIRS = new Set([
	'core', 'dist', 'node_modules',
]);

const INJECT_TARGETS = [
	'index.html', 'shootout/shootout.html', 'perf/perf.html', 'preview/index.html',
];

const IMPORTMAP_START = '<!-- importmap:start -->';
const IMPORTMAP_END = '<!-- importmap:end -->';
const DEFINE_PATTERN = /customElements\.define\(\s*['"]([a-z][a-z0-9-]*)['"]/g;
const SPECIFIER_PATTERN = /static\s+specifier\s*=\s*['"]([^'"]+)['"]/;
const IGNORE_PATTERN = /\/\/\s*@importmap-ignore|static\s+importmapIgnore\s*=\s*true/;

/**
 * Same rules as resolver.resolveTagUrl — pure site-relative path, or null when
 * the tag has no registered root prefix.
 */
export function resolveTagPath(tag) {
	const dash = tag.indexOf('-');
	if (dash === -1) {
		return null;
	}
	const base = ROOT_BASES[tag.slice(0, dash)];
	if (!base) {
		return null;
	}
	const segments = tag.slice(dash + 1).split('_');
	return `${base}/${segments.join('/')}/${segments[segments.length - 1]}.js`;
}

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

function moduleUrlToAbsolute(moduleUrl) {
	return join(CLIENT_ROOT, moduleUrl.replace(/^\//, ''));
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

/**
 * Pick the importmap URL for one tag.
 * Rooted tags → convention path (must exist on disk).
 * Others → scanned file URL.
 */
function resolveEntryUrl(tag, scannedUrl, drift) {
	const convention = resolveTagPath(tag);
	if (!convention) {
		return scannedUrl;
	}
	const conventionAbs = moduleUrlToAbsolute(convention);
	if (!existsSync(conventionAbs)) {
		drift.push({
			tag,
			kind: 'missing-convention-file',
			convention,
			scanned: scannedUrl,
		});
		return scannedUrl;
	}
	if (scannedUrl !== convention) {
		drift.push({
			tag,
			kind: 'define-not-at-convention-path',
			convention,
			scanned: scannedUrl,
		});
	}
	return convention;
}

function scanComponents() {
	const files = collectJsFiles(COMPONENTS_DIR, []);
	const entries = new Map();
	const collisions = [];
	const drift = [];
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
		const scannedUrl = toModuleUrl(absolutePath);
		const specifierMatch = SPECIFIER_PATTERN.exec(source);
		const extraSpecifier = specifierMatch ? specifierMatch[1] : null;
		for (let tagIndex = 0; tagIndex < tags.length; tagIndex++) {
			const tag = tags[tagIndex];
			const url = resolveEntryUrl(tag, scannedUrl, drift);
			const existing = entries.get(tag);
			if (existing && existing !== url) {
				collisions.push({
					specifier: tag,
					existing,
					incoming: url,
				});
			} else {
				entries.set(tag, url);
			}
		}
		// Friendly aliases always point at the file that declared them (scan path).
		if (extraSpecifier) {
			const existing = entries.get(extraSpecifier);
			if (existing && existing !== scannedUrl) {
				collisions.push({
					specifier: extraSpecifier,
					existing,
					incoming: scannedUrl,
				});
			} else {
				entries.set(extraSpecifier, scannedUrl);
			}
		}
	}
	return {
		entries,
		collisions,
		drift,
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

function reportDrift(drift) {
	if (!drift.length) {
		return;
	}
	console.warn(`[importmap] ${drift.length} path convention warning(s) (tag vs resolveTagUrl):`);
	for (let index = 0; index < drift.length; index++) {
		const item = drift[index];
		if (item.kind === 'missing-convention-file') {
			console.warn(`  <${item.tag}> expected ${item.convention} (missing); using ${item.scanned}`);
		} else {
			console.warn(`  <${item.tag}> define in ${item.scanned}; convention ${item.convention}`);
		}
	}
}

function run() {
	const shouldInject = process.argv.includes('--inject');
	const strict = process.argv.includes('--strict');
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
	reportDrift(scan.drift);
	if (shouldInject) {
		const injection = injectIntoHtml(imports);
		if (injection.updated.length) {
			console.log(`[importmap] injected importmap into: ${injection.updated.join(', ')}`);
		}
		if (injection.skipped.length) {
			console.warn(`[importmap] no ${IMPORTMAP_START} … ${IMPORTMAP_END} markers in: ${injection.skipped.join(', ')} (skipped)`);
		}
	}
	if (strict && (scan.drift.length || scan.collisions.length)) {
		process.exitCode = 1;
	}
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
	run();
}
