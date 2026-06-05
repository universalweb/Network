/*
 * Dead `var(--token, #hex)` fallback stripper (sweep #2 · color C4, css-style.md §6).
 *
 * A `var(--X, #hex)` fallback fires ONLY when --X is unset. Every token in the
 * always-`@import`'d base `:root` (styles/variables.css) is a guaranteed floor, so
 * its hex fallback can never fire — `var(--X)` resolves identically (the fallback is
 * dead code, regardless of whether the hex matches the token's value). Stripping it
 * removes pure entropy with zero render change. Custom properties inherit across the
 * shadow boundary, so the base floor reaches UWC shadow components too.
 *
 * GATED by an allowlist of base-:root token names: a fallback is stripped only when
 * its token is in the allowlist. Tokens defined NOWHERE (e.g. --color-accent) have a
 * LIVE fallback — the hex is the real colour — and are absent from the allowlist, so
 * they are left untouched.
 *
 * Unlike the tokenize codemods this scans the WHOLE text (comments masked), not a
 * `prop: value;` declaration: a `var(--X, #hex)` string is self-delimiting and also
 * appears inside CUSTOM-PROPERTY values (`--accent: var(--teal, #6d4aff)`) which the
 * declaration scan's lookbehind deliberately skips — those dead fallbacks must strip
 * too. Idempotent.
 *
 *   node scripts/cssTokenize/stripFallbacks.js <targetDir> [--dry-run]
 */
import { dirname, join, relative } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { collectCssFiles } from './tokenizeCss.js';
import { fileURLToPath } from 'node:url';
const FALLBACK_PATTERN = /var\(\s*(--[a-z0-9-]+)\s*,\s*#[0-9a-fA-F]{3,8}\s*\)/g;
/**
 * Mark every character position inside a `/* … *\/` comment so a fallback written in a
 * commented-out rule is never stripped.
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
 * Strip dead fallbacks across a CSS blob, preserving all surrounding bytes. Idempotent.
 * @param {string} text - The CSS source.
 * @param {Set<string>} allowedTokens - Base-:root token names whose fallback is dead.
 * @returns {{ text:string, strips:{token:string}[] }} New text + strips applied.
 */
export function transformText(text, allowedTokens) {
	const inComment = markComments(text);
	const strips = [];
	let result = '';
	let lastIndex = 0;
	for (const match of text.matchAll(FALLBACK_PATTERN)) {
		const token = match[1];
		if (inComment[match.index] || !allowedTokens.has(token)) {
			continue;
		}
		strips.push({
			token,
		});
		result += `${text.slice(lastIndex, match.index)}var(${token})`;
		lastIndex = match.index + match[0].length;
	}
	result += text.slice(lastIndex);
	return {
		text: result,
		strips,
	};
}
/**
 * Build the allowlist of guaranteed-floor token names from base `:root`.
 * Excludes any token defined inside an `@media` block (conditional, not a floor).
 * @param {string} variablesCss - The styles/variables.css source.
 * @returns {Set<string>} Base-:root token names.
 */
export function baseRootTokens(variablesCss) {
	const withoutMedia = variablesCss.replace(/@media[^{]*\{[\s\S]*?\}\s*\}/g, '');
	const names = [...withoutMedia.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((match) => {
		return match[1];
	});
	return new Set(names);
}
function run() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const targetDir = args.find((arg) => {
		return !arg.startsWith('--');
	});
	if (!targetDir) {
		console.error('usage: node stripFallbacks.js <targetDir> [--dry-run]');
		process.exitCode = 1;
		return;
	}
	const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
	const allowedTokens = baseRootTokens(readFileSync(join(clientRoot, 'styles', 'variables.css'), 'utf8'));
	const files = collectCssFiles(targetDir);
	const perToken = new Map();
	let totalStrips = 0;
	let changedFiles = 0;
	for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
		const filePath = files[fileIndex];
		const original = readFileSync(filePath, 'utf8');
		const {
			text, strips,
		} = transformText(original, allowedTokens);
		if (strips.length === 0) {
			continue;
		}
		changedFiles++;
		totalStrips += strips.length;
		console.log(`\n${relative(process.cwd(), filePath)}  (${strips.length})`);
		for (let stripIndex = 0; stripIndex < strips.length; stripIndex++) {
			const token = strips[stripIndex].token;
			perToken.set(token, (perToken.get(token) ?? 0) + 1);
		}
		if (!dryRun) {
			writeFileSync(filePath, text);
		}
	}
	console.log(`\n${dryRun ? 'DRY-RUN ' : ''}per-token strips:`);
	for (const [
		token,
		count,
	] of [...perToken.entries()].sort()) {
		console.log(`  ${token} : ${count}`);
	}
	console.log(`${dryRun ? 'DRY-RUN ' : ''}${totalStrips} strips across ${changedFiles} files`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
	run();
}
