/*
 * Hardcoded-hex → semantic-token routing codemod (sweep #2 · color C2, css-style.md §6).
 *
 * Components hardcode the midnight-resolved value of an accent/status colour
 * (e.g. `color: #6d4aff`), so they stay that hue under every OTHER theme — theming
 * is broken for them. Routing the hex onto its semantic token (`var(--teal)`) is
 * pixel-identical under midnight (the default, where the token resolves to that hex)
 * and correct under noir/marathon/dark. Status routes additionally consolidate
 * near-duplicate shades (three reds → one --color-danger).
 *
 * Only the §-listed route hexes are in the map; every decorative/asset/local hex is
 * simply absent → untouched. A hex used as a `var()` FALLBACK is left for C4: the
 * scan masks every `var(...)` span (nesting-aware) and routes only hexes in the
 * remainder, so `var(--teal, #6d4aff)` and gradients with a mixed value are safe.
 * Same declaration-oriented scan as logicalProps.js / tokenizeCss.js. Idempotent.
 *
 *   node scripts/cssTokenize/colorRoute.js <targetDir> [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { collectCssFiles } from './tokenizeCss.js';
import { relative } from 'node:path';
/** Route hexes (lowercased) → semantic token. Decorative/asset/local hexes are absent. */
export const HEX_TO_TOKEN = new Map([
	['#f87171', '--color-danger'],
	['#ef4444', '--color-danger'],
	['#fca5a5', '--color-danger'],
	['#34d399', '--color-success'],
	['#10b981', '--color-success'],
	['#6d4aff', '--teal'],
	['#fbbf24', '--color-warning'],
	['#f59e0b', '--color-warning'],
	['#60a5fa', '--color-info'],
	['#a5b4fc', '--color-info'],
	['#fff', '--text-light'],
	['#ffffff', '--text-light'],
]);
const DECLARATION_PATTERN = /(?<![\w-])([a-zA-Z][\w-]*)(\s*:\s*)([^;{}]+?)(\s*;)/g;
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;
/**
 * Mark every character position that lies inside a `var(...)` call so hexes there
 * (fallbacks → C4) are never routed. Nesting-aware: tracks which open parens belong
 * to a `var(` so a hex inside `linear-gradient(var(--x,#h), #standalone)` only shields #h.
 * @param {string} value - A declaration value.
 * @returns {boolean[]} Per-position flag, true when inside a var() call.
 */
function markInsideVar(value) {
	const inside = new Array(value.length).fill(false);
	const varParenStack = [];
	for (let position = 0; position < value.length; position++) {
		const character = value[position];
		if (character === '(') {
			varParenStack.push((/var$/i).test(value.slice(Math.max(0, position - 3), position)));
		} else if (character === ')') {
			varParenStack.pop();
		}
		if (varParenStack.includes(true)) {
			inside[position] = true;
		}
	}
	return inside;
}
/**
 * Route every standalone route-hex in a declaration value to its token.
 * @param {string} value - The declaration value (already colon/semicolon-trimmed).
 * @returns {{ value:string, subs:{hex:string,token:string}[] }} New value + routes applied.
 */
function routeValue(value) {
	const inside = markInsideVar(value);
	const subs = [];
	let result = '';
	let lastIndex = 0;
	for (const match of value.matchAll(HEX_PATTERN)) {
		if (inside[match.index]) {
			continue;
		}
		const token = HEX_TO_TOKEN.get(match[0].toLowerCase());
		if (!token) {
			continue;
		}
		subs.push({
			hex: match[0].toLowerCase(),
			token,
		});
		result += `${value.slice(lastIndex, match.index)}var(${token})`;
		lastIndex = match.index + match[0].length;
	}
	result += value.slice(lastIndex);
	return {
		value: result,
		subs,
	};
}
/**
 * Route every in-scope hex across a CSS blob, preserving all surrounding bytes. Idempotent.
 * @param {string} text - The CSS source.
 * @returns {{ text:string, subs:{hex:string,token:string}[] }} New text + routes applied.
 */
export function transformText(text) {
	const subs = [];
	let result = '';
	let lastIndex = 0;
	for (const match of text.matchAll(DECLARATION_PATTERN)) {
		const routed = routeValue(match[3]);
		if (routed.subs.length === 0) {
			continue;
		}
		for (let subIndex = 0; subIndex < routed.subs.length; subIndex++) {
			subs.push(routed.subs[subIndex]);
		}
		result += `${text.slice(lastIndex, match.index)}${match[1]}${match[2]}${routed.value}${match[4]}`;
		lastIndex = match.index + match[0].length;
	}
	result += text.slice(lastIndex);
	return {
		text: result,
		subs,
	};
}
function run() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const targetDir = args.find((arg) => {
		return !arg.startsWith('--');
	});
	if (!targetDir) {
		console.error('usage: node colorRoute.js <targetDir> [--dry-run]');
		process.exitCode = 1;
		return;
	}
	const files = collectCssFiles(targetDir);
	const perHex = new Map();
	let totalSubs = 0;
	let changedFiles = 0;
	for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
		const filePath = files[fileIndex];
		const original = readFileSync(filePath, 'utf8');
		const {
			text, subs,
		} = transformText(original);
		if (subs.length === 0) {
			continue;
		}
		changedFiles++;
		totalSubs += subs.length;
		console.log(`\n${relative(process.cwd(), filePath)}  (${subs.length})`);
		for (let subIndex = 0; subIndex < subs.length; subIndex++) {
			const sub = subs[subIndex];
			console.log(`  ${sub.hex} -> var(${sub.token})`);
			perHex.set(sub.hex, (perHex.get(sub.hex) ?? 0) + 1);
		}
		if (!dryRun) {
			writeFileSync(filePath, text);
		}
	}
	console.log(`\n${dryRun ? 'DRY-RUN ' : ''}per-hex counts:`);
	for (const [
		hex,
		count,
	] of [...perHex.entries()].sort()) {
		console.log(`  ${hex} : ${count}`);
	}
	console.log(`${dryRun ? 'DRY-RUN ' : ''}${totalSubs} routes across ${changedFiles} files`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
	run();
}
