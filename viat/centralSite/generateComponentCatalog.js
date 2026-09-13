/*
	Component catalogue generator.
	Emits `components/global/COMPONENTS.md` — the framework-wide catalogue of every
	NON-USER component: the whole `components/global/` tree plus the built-ins that
	live in `components/core/` (currently `<ui-tooltip>`).
	WHY THIS IS GENERATED. The hand-written manifest it replaces claimed 113 tags
	while the tree held 244. A catalogue nobody can regenerate silently rots into
	fiction, so every DERIVABLE column here is recomputed from the tree on demand.
	Editorial judgement (priority, roadmap, "why this is next") does NOT live here —
	it lives on the engram task board and is referenced by task id.
	Detection matches the runtime contract, not a naming convention: a component is
	whatever calls `customElements.define('tag', Class)`. Comments are stripped
	first, because `core/base.js` carries a JSDoc `@example` that defines
	`ui-counter` — a documentation illustration, not a component. A raw grep counts
	it and invents a component that has never existed.
	Excluded by design: `components/user/` (app components, not framework), test
	probes under `tests/` or `*.test.js`, and `perf`/`shootout` harness elements.
	Usage:
	  node ./viat/centralSite/generateComponentCatalog.js           # write COMPONENTS.md
	  node ./viat/centralSite/generateComponentCatalog.js --check   # exit 1 if stale
	  node ./viat/centralSite/generateComponentCatalog.js --json    # emit raw records
	Run via: pnpm run build:catalog
*/
import {
	existsSync, readdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_ROOT = join(SCRIPT_DIR, 'client');
const COMPONENTS_DIR = join(CLIENT_ROOT, 'components');
const GLOBAL_DIR = join(COMPONENTS_DIR, 'global');
const CORE_DIR = join(COMPONENTS_DIR, 'core');
const CATALOG_FILE = join(CLIENT_ROOT, 'preview', 'catalog.js');
const OUTPUT_FILE = join(GLOBAL_DIR, 'COMPONENTS.md');
const SKIP_DIRS = new Set([
	'dist', 'node_modules', 'themes', 'assets',
]);
/*
	`customElements.define('tag', Klass)`. The class name is captured because the
	preview catalog keys on CLASS (`BootScreen`, `ControlCenterTile`), not on tag —
	tag→class is not a mechanical transform, so the join needs the real identifier.
*/
const DEFINE_PATTERN = /customElements\.define\(\s*['"]([a-z][a-z0-9-]*)['"]\s*,\s*([A-Za-z_$][\w$]*)/g;
const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT_PATTERN = /^\s*\/\/.*$/gm;
/*
	A component counts as documented if it carries a `DESCRIPTION:` marker or opens
	with the house `<ui-tag> — what it is` line. BOTH comment styles must match:
	13 components (toolbar, modal, dock, status-bar, …) document themselves with
	`//` rather than a block comment, and a block-only pattern filed every one of
	them as undocumented — inventing work that was already done.
*/
const DESCRIPTION_PATTERN = /DESCRIPTION:|^\s*(?:\*|\/\/)\s*`?<[a-z-]+>`?\s+—/m;
const PREVIEW_ID_PATTERN = /^\s*id:\s*'([^']+)'/gm;
const PREVIEW_CATEGORY_PATTERN = /^\s*id:\s*'([^']+)',\s*$\n\s*category:\s*'([^']+)'/gm;
const ALIAS_BLOCK_PATTERN = /export const CATALOG_ALIASES = \{([\s\S]*?)\};/;
const ALIAS_ENTRY_PATTERN = /(\w+):\s*'([^']+)'/g;
const PRIVATE_BLOCK_PATTERN = /export const CATALOG_PRIVATE_TAGS = \[([\s\S]*?)\];/;
const PRIVATE_TAG_PATTERN = /'([a-z][a-z0-9-]*)'/g;
/**
 * Remove comments so a documented `customElements.define(...)` example is not
 * counted as a live registration. Line comments are anchored to line start so a
 * `https://` inside a string literal survives.
 * @param {string} source - Raw module text.
 * @returns {string} Source with comments blanked.
 */
export function stripComments(source) {
	return source.replace(BLOCK_COMMENT_PATTERN, '').replace(LINE_COMMENT_PATTERN, '');
}
/**
 * True when a path is a test probe rather than a shipped component.
 * @param {string} relativePath - Path relative to the components root.
 * @returns {boolean} True for test files.
 */
export function isTestPath(relativePath) {
	return relativePath.endsWith('.test.js') || (/(^|\/)tests?\//).test(relativePath);
}
function collectJsFiles(directory, found) {
	const entries = readdirSync(directory, {
		withFileTypes: true,
	});
	const entryCount = entries.length;
	for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
		const entry = entries[entryIndex];
		if (entry.isDirectory()) {
			if (!SKIP_DIRS.has(entry.name)) {
				collectJsFiles(join(directory, entry.name), found);
			}
			continue;
		}
		if (entry.isFile() && entry.name.endsWith('.js')) {
			found.push(join(directory, entry.name));
		}
	}
	return found;
}
function toPosixPath(absolutePath) {
	return relative(COMPONENTS_DIR, absolutePath).split(sep).join('/');
}
/**
 * Every live registration in one module.
 * @param {string} source - Comment-stripped module text.
 * @returns {Array<{tag: string, className: string}>} Registrations in file order.
 */
export function extractDefines(source) {
	const defines = [];
	DEFINE_PATTERN.lastIndex = 0;
	let match = DEFINE_PATTERN.exec(source);
	while (match) {
		defines.push({
			tag: match[1],
			className: match[2],
		});
		match = DEFINE_PATTERN.exec(source);
	}
	return defines;
}
/**
 * Preview coverage, read statically from `preview/catalog.js` so the generator
 * never executes browser code. Returns class id → category.
 * @returns {Map<string, string>} Catalogued ids mapped to their preview category.
 */
export function readPreviewIds() {
	const catalogued = new Map();
	if (!existsSync(CATALOG_FILE)) {
		return catalogued;
	}
	const source = readFileSync(CATALOG_FILE, 'utf8');
	PREVIEW_CATEGORY_PATTERN.lastIndex = 0;
	let match = PREVIEW_CATEGORY_PATTERN.exec(source);
	while (match) {
		catalogued.set(match[1], match[2]);
		match = PREVIEW_CATEGORY_PATTERN.exec(source);
	}
	/* Entries whose category sits on another line still count as covered. */
	PREVIEW_ID_PATTERN.lastIndex = 0;
	let idMatch = PREVIEW_ID_PATTERN.exec(source);
	while (idMatch) {
		if (!catalogued.has(idMatch[1])) {
			catalogued.set(idMatch[1], '');
		}
		idMatch = PREVIEW_ID_PATTERN.exec(source);
	}
	return catalogued;
}
/**
 * Preset subclasses the preview catalog already declares as aliases of another
 * component (`ui-to-top` … are all the `UIGoTo` engine). They are real registered
 * tags, so they belong in the inventory, but they are NOT separate work items —
 * counting them would inflate the catalogue and file six phantom "missing
 * preview" gaps against a component that is in fact catalogued.
 * @returns {Map<string, string>} Alias class name mapped to its target class.
 */
export function readCatalogAliases() {
	const aliases = new Map();
	if (!existsSync(CATALOG_FILE)) {
		return aliases;
	}
	const block = ALIAS_BLOCK_PATTERN.exec(readFileSync(CATALOG_FILE, 'utf8'));
	if (!block) {
		return aliases;
	}
	ALIAS_ENTRY_PATTERN.lastIndex = 0;
	let match = ALIAS_ENTRY_PATTERN.exec(block[1]);
	while (match) {
		aliases.set(match[1], match[2]);
		match = ALIAS_ENTRY_PATTERN.exec(block[1]);
	}
	return aliases;
}
/**
 * Tags under components/global that are deliberately off the preview catalog
 * (AppShell is the preview host). Parsed from `CATALOG_PRIVATE_TAGS` so the
 * generator and the catalog invariant share one list.
 * @returns {Set<string>} Private tag names.
 */
export function readCatalogPrivateTags() {
	const tags = new Set();
	if (!existsSync(CATALOG_FILE)) {
		return tags;
	}
	const block = PRIVATE_BLOCK_PATTERN.exec(readFileSync(CATALOG_FILE, 'utf8'));
	if (!block) {
		return tags;
	}
	PRIVATE_TAG_PATTERN.lastIndex = 0;
	let match = PRIVATE_TAG_PATTERN.exec(block[1]);
	while (match) {
		tags.add(match[1]);
		match = PRIVATE_TAG_PATTERN.exec(block[1]);
	}
	return tags;
}
/**
 * Does this component directory carry its own test? Both house layouts count:
 * a co-located `foo.test.js` and a `tests/` subdirectory.
 * @param {string} directory - Absolute component directory.
 * @returns {boolean} True when at least one test file exists.
 */
export function hasTest(directory) {
	const entries = readdirSync(directory, {
		withFileTypes: true,
	});
	const entryCount = entries.length;
	for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
		const entry = entries[entryIndex];
		if (entry.isFile() && entry.name.endsWith('.test.js')) {
			return true;
		}
		if (entry.isDirectory() && entry.name === 'tests') {
			const testFiles = readdirSync(join(directory, 'tests'));
			if (testFiles.some(isTestFileName)) {
				return true;
			}
		}
	}
	return false;
}
function isTestFileName(fileName) {
	return fileName.endsWith('.test.js');
}
function countLines(absolutePath) {
	return readFileSync(absolutePath, 'utf8').split('\n').length;
}
function hasStylesheet(directory) {
	const entries = readdirSync(directory);
	return entries.some(isCssFileName);
}
function isCssFileName(fileName) {
	return fileName.endsWith('.css');
}
/**
 * Build one record per registered component across the framework trees.
 * @returns {Array<object>} Component records, sorted by tag.
 */
export function scanComponents() {
	const previewIds = readPreviewIds();
	const aliases = readCatalogAliases();
	const privateTags = readCatalogPrivateTags();
	const records = [];
	const seenTags = new Set();
	const areas = [
		{
			root: GLOBAL_DIR,
			area: 'global',
		},
		{
			root: CORE_DIR,
			area: 'core',
		},
	];
	const areaCount = areas.length;
	for (let areaIndex = 0; areaIndex < areaCount; areaIndex += 1) {
		const {
			root, area,
		} = areas[areaIndex];
		const files = collectJsFiles(root, []);
		const fileCount = files.length;
		for (let fileIndex = 0; fileIndex < fileCount; fileIndex += 1) {
			const absolutePath = files[fileIndex];
			const relativePath = toPosixPath(absolutePath);
			if (isTestPath(relativePath)) {
				continue;
			}
			const raw = readFileSync(absolutePath, 'utf8');
			const defines = extractDefines(stripComments(raw));
			const defineCount = defines.length;
			if (defineCount === 0) {
				continue;
			}
			const directory = absolutePath.slice(0, absolutePath.lastIndexOf(sep));
			const documented = DESCRIPTION_PATTERN.test(raw);
			const tested = hasTest(directory);
			const styled = hasStylesheet(directory);
			const lines = countLines(absolutePath);
			for (let defineIndex = 0; defineIndex < defineCount; defineIndex += 1) {
				const {
					tag, className,
				} = defines[defineIndex];
				if (seenTags.has(tag)) {
					continue;
				}
				seenTags.add(tag);
				/* An alias inherits its target's preview entry — that is what being an
				   alias means, so it is covered, not missing. A private tag is
				   deliberately off the catalog (AppShell is the preview host). */
				const aliasOf = aliases.get(className) ?? '';
				const previewKey = aliasOf || className;
				const isPrivate = privateTags.has(tag);
				records.push({
					tag,
					className,
					aliasOf,
					area,
					file: relativePath,
					lines,
					tested,
					styled,
					documented,
					previewed: isPrivate || previewIds.has(previewKey),
					category: previewIds.get(previewKey) ?? '',
				});
			}
		}
	}
	records.sort(byTag);
	return records;
}
function byTag(first, second) {
	return first.tag.localeCompare(second.tag);
}
function gapCount(record) {
	let gaps = 0;
	if (!record.tested) {
		gaps += 1;
	}
	if (!record.previewed) {
		gaps += 1;
	}
	if (!record.documented) {
		gaps += 1;
	}
	return gaps;
}
function byGapsThenSize(first, second) {
	const gapDelta = gapCount(second) - gapCount(first);
	if (gapDelta !== 0) {
		return gapDelta;
	}
	return second.lines - first.lines;
}
function mark(flag) {
	return flag ? '✅' : '—';
}
function countWhere(records, key) {
	let total = 0;
	const recordCount = records.length;
	for (let index = 0; index < recordCount; index += 1) {
		if (records[index][key]) {
			total += 1;
		}
	}
	return total;
}
function percent(part, whole) {
	if (whole === 0) {
		return '0%';
	}
	return `${Math.round((part / whole) * 100)}%`;
}
function summaryRow(label, part, whole) {
	return `| ${label} | ${part} / ${whole} | ${percent(part, whole)} |`;
}
function inventoryRow(record) {
	const category = record.category || (record.area === 'core' ? 'built-in' : '—');
	const label = record.aliasOf ? `${record.className} → ${record.aliasOf}` : record.className;
	return `| \`<${record.tag}>\` | ${label} | ${category} | ${mark(record.tested)} | ${mark(record.previewed)} | ${mark(record.documented)} | ${record.lines} | ${record.file} |`;
}
function workRow(record) {
	const needs = [];
	if (!record.tested) {
		needs.push('tests');
	}
	if (!record.previewed) {
		needs.push('preview');
	}
	if (!record.documented) {
		needs.push('docs');
	}
	return `| \`<${record.tag}>\` | ${record.lines} | ${needs.join(' · ')} |`;
}
function renderRows(records, rowFn) {
	const lines = [];
	const recordCount = records.length;
	for (let index = 0; index < recordCount; index += 1) {
		lines.push(rowFn(records[index]));
	}
	return lines.join('\n');
}
/**
 * Render the catalogue. Derived columns only — priorities belong on the task board.
 * @param {Array<object>} records - Component records from scanComponents.
 * @returns {string} Markdown document.
 */
export function renderCatalog(records) {
	const total = records.length;
	const globalRecords = records.filter(isGlobalRecord);
	const coreRecords = records.filter(isCoreRecord);
	const needsWork = records.filter(hasGap).sort(byGapsThenSize);
	const aliasCount = records.filter(isAliasRecord).length;
	const distinct = total - aliasCount;
	const generated = new Date().toISOString().slice(0, 10);
	return `# UWC Component Catalogue

**GENERATED FILE — do not hand-edit.** Regenerate with \`pnpm run build:catalog\`.
Every column below is derived from the tree, so this file cannot drift from reality
the way the hand-written manifest did (it claimed 113 components against a tree of
${globalRecords.length}). Priorities and roadmap live on the engram task board, not here.

Scope: the **framework** surface only — \`components/global/\` plus the built-ins
registered inside \`components/core/\`. App components under \`components/user/\` are
out of scope, as are test probes and the perf/shootout harnesses.

Generated ${generated}.

| Count | |
| --- | --- |
| Registered tags | **${total}** (${globalRecords.length} in \`global/\` · ${coreRecords.length} core built-in) |
| — alias presets | ${aliasCount} (a second tag on an existing engine — see \`CATALOG_ALIASES\`) |
| **Distinct components** | **${distinct}** |

## Coverage

| Signal | Covered | Share |
| --- | --- | --- |
${summaryRow('Has a test', countWhere(records, 'tested'), total)}
${summaryRow('In the preview catalog', countWhere(records, 'previewed'), total)}
${summaryRow('Has a description comment', countWhere(records, 'documented'), total)}
${summaryRow('Has a stylesheet', countWhere(records, 'styled'), total)}

## Work queue — ${needsWork.length} components with gaps

Ordered by number of gaps, then by size (bigger components carry more risk).
A component is "done" when it has a test, a preview entry, and a description comment.

| Component | Lines | Missing |
| --- | --- | --- |
${renderRows(needsWork, workRow)}

## Built-in components

Registered inside the core runtime rather than the component tree — always present,
no import required.

| Tag | Class | Category | Test | Preview | Docs | Lines | File |
| --- | --- | --- | --- | --- | --- | --- | --- |
${renderRows(coreRecords, inventoryRow)}

## Full inventory

| Tag | Class | Category | Test | Preview | Docs | Lines | File |
| --- | --- | --- | --- | --- | --- | --- | --- |
${renderRows(globalRecords, inventoryRow)}
`;
}
function isGlobalRecord(record) {
	return record.area === 'global';
}
function isCoreRecord(record) {
	return record.area === 'core';
}
/*
	An alias preset is not its own work item — it shares the engine, the tests and
	the preview page of the component it aliases. Listing it here would invent work
	that does not exist.
*/
function hasGap(record) {
	if (record.aliasOf) {
		return false;
	}
	return gapCount(record) > 0;
}
function isAliasRecord(record) {
	return Boolean(record.aliasOf);
}
function reportStale(markdown) {
	if (!existsSync(OUTPUT_FILE)) {
		console.error('COMPONENTS.md is missing — run: pnpm run build:catalog');
		return 1;
	}
	if (readFileSync(OUTPUT_FILE, 'utf8') !== markdown) {
		console.error('COMPONENTS.md is stale — run: pnpm run build:catalog');
		return 1;
	}
	console.log('COMPONENTS.md is up to date.');
	return 0;
}
function main() {
	const records = scanComponents();
	if (process.argv.includes('--json')) {
		console.log(JSON.stringify(records, null, '\t'));
		return 0;
	}
	const markdown = renderCatalog(records);
	if (process.argv.includes('--check')) {
		return reportStale(markdown);
	}
	writeFileSync(OUTPUT_FILE, markdown);
	const tested = countWhere(records, 'tested');
	const previewed = countWhere(records, 'previewed');
	console.log(`Wrote ${toPosixPath(OUTPUT_FILE)} — ${records.length} tags, ${tested} tested, ${previewed} in preview.`);
	return 0;
}
/*
	Only run when invoked directly. Importing this module must stay side-effect
	free, or a test that pulls in `stripComments` would silently rewrite
	COMPONENTS.md as an import side effect.
*/
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	process.exitCode = main();
}
