/*
 * Orphan-token → real-token rewrite codemod (sweep #2 · color C5, css-style.md §6).
 *
 * Some components reference a semantic token that is defined NOWHERE (`--color-accent`,
 * `--text-default`, `--danger`) and lean on a hardcoded hex fallback:
 * `var(--color-accent, #6d4aff)`. Because the token never resolves, the hex is the LIVE
 * rendered colour — frozen at the midnight value under every theme (the same theming
 * bug C2 fixed, in undefined-token form). Rewrite the orphan to the real token it was
 * standing in for and DROP the dead fallback: `var(--teal)`. The fallback hex equals the
 * target's midnight value (or a consolidated status shade), so this is pixel-identical
 * under the default theme and correct under the rest.
 *
 * Only the hex-fallback form is rewritten — `var(--text-default, currentColor)` renders
 * `currentColor` (not a proven identity) and is left for a deliberate pass. The greedy
 * `--[a-z0-9-]+` capture matches the FULL token name, so `--danger-hover` never collides
 * with `--danger`. Whole-text scan, comments masked (orphans appear in custom-prop
 * values too). Idempotent.
 *
 *   node scripts/cssTokenize/routeOrphanVars.js <targetDir> [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { collectCssFiles } from './tokenizeCss.js';
import { relative } from 'node:path';
/** Undefined orphan token → the real semantic token it stood in for. */
export const ORPHAN_TO_TARGET = new Map([
	['--color-accent', '--teal'],
	['--text-default', '--text-main'],
	['--danger', '--color-danger'],
]);
const FALLBACK_PATTERN = /var\(\s*(--[a-z0-9-]+)\s*,\s*#[0-9a-fA-F]{3,8}\s*\)/g;
/**
 * Mark every character position inside a `/* … *\/` comment so an orphan written in a
 * commented-out rule is never rewritten.
 * @param {string} text - The CSS source.
 * @returns {boolean[]} Per-position flag, true when inside a comment.
 */
function markComments(text) {
	const inside = new Array(text.length).fill(false);
	let position = 0;
	while (position < text.length) {
		if (text[position] === '/' && text[position + 1] === '*') {
			const closeIndex = text.indexOf('*/', position + 2);
			const commentStop = closeIndex === -1 ? text.length : closeIndex + 2;
			for (let fillIndex = position; fillIndex < commentStop; fillIndex++) {
				inside[fillIndex] = true;
			}
			position = commentStop;
		} else {
			position++;
		}
	}
	return inside;
}
/**
 * Rewrite every orphan-token hex-fallback to its real token across a CSS blob,
 * preserving all surrounding bytes. Idempotent.
 * @param {string} text - The CSS source.
 * @returns {{ text:string, routes:{from:string,to:string}[] }} New text + routes applied.
 */
export function transformText(text) {
	const inComment = markComments(text);
	const routes = [];
	let result = '';
	let lastIndex = 0;
	for (const match of text.matchAll(FALLBACK_PATTERN)) {
		const target = ORPHAN_TO_TARGET.get(match[1]);
		if (inComment[match.index] || target === undefined) {
			continue;
		}
		routes.push({
			from: match[1],
			to: target,
		});
		result += `${text.slice(lastIndex, match.index)}var(${target})`;
		lastIndex = match.index + match[0].length;
	}
	result += text.slice(lastIndex);
	return {
		text: result,
		routes,
	};
}
function run() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const targetDir = args.find((arg) => {
		return !arg.startsWith('--');
	});
	if (!targetDir) {
		console.error('usage: node routeOrphanVars.js <targetDir> [--dry-run]');
		process.exitCode = 1;
		return;
	}
	const files = collectCssFiles(targetDir);
	const perRoute = new Map();
	let totalRoutes = 0;
	let changedFiles = 0;
	for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
		const filePath = files[fileIndex];
		const original = readFileSync(filePath, 'utf8');
		const {
			text, routes,
		} = transformText(original);
		if (routes.length === 0) {
			continue;
		}
		changedFiles++;
		totalRoutes += routes.length;
		console.log(`\n${relative(process.cwd(), filePath)}  (${routes.length})`);
		for (let routeIndex = 0; routeIndex < routes.length; routeIndex++) {
			const route = routes[routeIndex];
			const key = `${route.from} -> ${route.to}`;
			perRoute.set(key, (perRoute.get(key) ?? 0) + 1);
		}
		if (!dryRun) {
			writeFileSync(filePath, text);
		}
	}
	console.log(`\n${dryRun ? 'DRY-RUN ' : ''}per-route counts:`);
	for (const [
		route,
		count,
	] of [...perRoute.entries()].sort()) {
		console.log(`  ${route} : ${count}`);
	}
	console.log(`${dryRun ? 'DRY-RUN ' : ''}${totalRoutes} routes across ${changedFiles} files`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
	run();
}
