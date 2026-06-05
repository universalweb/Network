/*
 * CSS unit-modernization codemod (sweep #2 · Slice A).
 *
 * Walks a target dir's *.css and rewrites in-scope declarations, snapping
 * hardcoded px spacing/radius and rem font-size/weight to the token scale via
 * snap.js. Line-oriented: only a simple `prop: value;` line is touched;
 * selectors, at-rules, comments, blank lines, and any function value are copied
 * byte-for-byte. Idempotent.
 *
 *   node scripts/cssTokenize/tokenizeCss.js <targetDir> [--dry-run]
 *
 * --dry-run prints a per-file mapping report and writes nothing.
 */
import { bucketForProperty, snapValue } from './snap.js';
import { join, relative } from 'node:path';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
/*
 * Declaration-oriented (NOT line-oriented): matches every `prop: value;` anywhere
 * — handles multiple declarations per line and inline `selector { decl; }` rules.
 * The `(?<![\w-])` lookbehind excludes custom-property names (`--bar-gap`) and
 * longer identifiers; `[^;{}]` keeps the value inside one declaration, so at-rule
 * preludes (`@media (max-width: 600px) {` — no terminating `;`) never match.
 */
const DECLARATION_PATTERN = /(?<![\w-])([a-zA-Z][\w-]*)\s*:\s*([^;{}]+?)\s*;/g;
/**
 * Transform a whole text blob. Replaces only changed, in-scope declarations,
 * slicing untouched regions (selectors, braces, comments, color, functions)
 * through byte-for-byte. Idempotent.
 * @param {string} text
 * @returns {{ text:string, changes:{property:string,from:string,to:string}[] }}
 */
export function transformText(text) {
	const changes = [];
	let result = '';
	let lastIndex = 0;
	const matches = text.matchAll(DECLARATION_PATTERN);
	for (const match of matches) {
		const property = match[1];
		const rawValue = match[2];
		const bucket = bucketForProperty(property);
		if (!bucket) {
			continue;
		}
		const snapped = snapValue(rawValue, bucket);
		if (snapped.changes.length === 0) {
			continue;
		}
		for (let changeIndex = 0; changeIndex < snapped.changes.length; changeIndex++) {
			const entry = snapped.changes[changeIndex];
			changes.push({
				property,
				from: entry.from,
				to: entry.to,
			});
		}
		result += `${text.slice(lastIndex, match.index)}${property}: ${snapped.value};`;
		lastIndex = match.index + match[0].length;
	}
	result += text.slice(lastIndex);
	return {
		text: result,
		changes,
	};
}
/**
 * Transform a single line (thin wrapper over transformText for unit testing).
 * @param {string} line
 * @returns {{ line:string, changes:{property:string,from:string,to:string}[] }}
 */
export function transformLine(line) {
	const result = transformText(line);
	return {
		line: result.text,
		changes: result.changes,
	};
}
/** Recursively collect *.css paths under a directory. */
export function collectCssFiles(directory) {
	const found = [];
	const entries = readdirSync(directory, {
		withFileTypes: true,
	});
	for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
		const entry = entries[entryIndex];
		const fullPath = join(directory, entry.name);
		if (entry.isDirectory()) {
			const nested = collectCssFiles(fullPath);
			for (let nestedIndex = 0; nestedIndex < nested.length; nestedIndex++) {
				found.push(nested[nestedIndex]);
			}
		} else if (entry.name.endsWith('.css')) {
			found.push(fullPath);
		}
	}
	return found;
}
function run() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const targetDir = args.find((arg) => {
		return !arg.startsWith('--');
	});
	if (!targetDir) {
		console.error('usage: node tokenizeCss.js <targetDir> [--dry-run]');
		process.exitCode = 1;
		return;
	}
	const files = collectCssFiles(targetDir);
	let totalChanges = 0;
	let changedFiles = 0;
	for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
		const filePath = files[fileIndex];
		const original = readFileSync(filePath, 'utf8');
		const {
			text, changes,
		} = transformText(original);
		if (changes.length === 0) {
			continue;
		}
		changedFiles++;
		totalChanges += changes.length;
		console.log(`\n${relative(process.cwd(), filePath)}  (${changes.length})`);
		for (let changeIndex = 0; changeIndex < changes.length; changeIndex++) {
			const change = changes[changeIndex];
			console.log(`  ${change.property}: ${change.from} -> ${change.to}`);
		}
		if (!dryRun) {
			writeFileSync(filePath, text);
		}
	}
	console.log(`\n${dryRun ? 'DRY-RUN ' : ''}${totalChanges} substitutions across ${changedFiles} files`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
	run();
}
