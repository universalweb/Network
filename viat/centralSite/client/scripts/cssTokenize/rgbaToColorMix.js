/*
 * Translucent-token rgba → `color-mix()` codemod (sweep #2 · color C3, css-style.md §6).
 *
 * A component that writes `rgba(109, 74, 255, 0.34)` has hardcoded the MIDNIGHT value of
 * --teal at 34% alpha — a frozen translucent accent that stays violet under every theme
 * (the C2/C5 bug-class, with alpha). Rewrite it to
 * `color-mix(in oklab, var(--teal) 34%, transparent)`: the glow/tint now follows the
 * theme. IDENTITY under the default theme — mixing an opaque colour with `transparent`
 * ignores the interpolation space (transparent contributes no colour, only dilutes alpha
 * premultiplied), so the result is exactly the colour at that alpha == the original rgba.
 *
 * Discriminator: the rgba's r,g,b triple equals a midnight token's value (the C5
 * hex==token pattern, with alpha). The map EXCLUDES pure white/black — those translucents
 * are structural (shadows, dividers, glass highlights), not frozen accents — and resolves
 * a value shared by a base + a variant token (e.g. --color-success / --green-hover) to the
 * BASE. Only translucent (alpha < 1) rgba is rewritten; solid rgb is left. Whole-text scan,
 * comments masked. Idempotent.
 *
 *   node scripts/cssTokenize/rgbaToColorMix.js <targetDir> [--dry-run]
 */
import { dirname, join, relative } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { collectCssFiles } from './tokenizeCss.js';
import { fileURLToPath } from 'node:url';
const RGBA_PATTERN = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)/g;
const VARIANT_SUFFIX = /-(hover|glow|dim|soft|active|text|border|tint|shadow|mid|light)$/;
/**
 * Convert a #hex (3 or 6 digit) to an "r,g,b" decimal key.
 * @param {string} hex - The hex colour, with leading #.
 * @returns {string} The "r,g,b" key.
 */
function hexToRgbKey(hex) {
	let body = hex.slice(1);
	if (body.length === 3) {
		body = `${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`;
	}
	const red = parseInt(body.slice(0, 2), 16);
	const green = parseInt(body.slice(2, 4), 16);
	const blue = parseInt(body.slice(4, 6), 16);
	return `${red},${green},${blue}`;
}
/**
 * Build the "r,g,b" → token-name map from a theme's hex token definitions. Pure white and
 * black are excluded (structural, not accents); a value shared by a base and a variant
 * token resolves to the base (non-variant) name.
 * @param {string} themeCss - A theme stylesheet (the default theme, midnight).
 * @returns {Map<string,string>} The colour-key → token-name map.
 */
export function midnightTokenRgb(themeCss) {
	const map = new Map();
	for (const match of themeCss.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/gim)) {
		const token = match[1];
		const key = hexToRgbKey(match[2]);
		if (key === '255,255,255' || key === '0,0,0') {
			continue;
		}
		const existing = map.get(key);
		if (existing === undefined || (VARIANT_SUFFIX.test(existing) && !VARIANT_SUFFIX.test(token))) {
			map.set(key, token);
		}
	}
	return map;
}
/**
 * Format an alpha string (0–1) as a clean color-mix percentage, free of float noise.
 * @param {string} alpha - The alpha component (e.g. "0.34", "0.015").
 * @returns {string} The percentage token (e.g. "34%", "1.5%").
 */
function formatPercent(alpha) {
	return `${Number((parseFloat(alpha) * 100).toFixed(4))}%`;
}
/**
 * Mark every character position inside a `/* … *\/` comment so an rgba in a commented-out
 * rule is never rewritten.
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
 * Rewrite every translucent token-matched rgba to color-mix across a CSS blob, preserving
 * all surrounding bytes. Idempotent.
 * @param {string} text - The CSS source.
 * @param {Map<string,string>} tokenByRgb - The "r,g,b" → token-name map.
 * @returns {{ text:string, mixes:{token:string}[] }} New text + mixes applied.
 */
export function transformText(text, tokenByRgb) {
	const inComment = markComments(text);
	const mixes = [];
	let result = '';
	let lastIndex = 0;
	for (const match of text.matchAll(RGBA_PATTERN)) {
		const alpha = match[4];
		const token = tokenByRgb.get(`${Number(match[1])},${Number(match[2])},${Number(match[3])}`);
		if (inComment[match.index] || token === undefined || alpha === undefined || parseFloat(alpha) >= 1) {
			continue;
		}
		mixes.push({
			token,
		});
		result += `${text.slice(lastIndex, match.index)}color-mix(in oklab, var(${token}) ${formatPercent(alpha)}, transparent)`;
		lastIndex = match.index + match[0].length;
	}
	result += text.slice(lastIndex);
	return {
		text: result,
		mixes,
	};
}
function run() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const targetDir = args.find((arg) => {
		return !arg.startsWith('--');
	});
	if (!targetDir) {
		console.error('usage: node rgbaToColorMix.js <targetDir> [--dry-run]');
		process.exitCode = 1;
		return;
	}
	const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
	const tokenByRgb = midnightTokenRgb(readFileSync(join(clientRoot, 'styles', 'themes', 'midnight.css'), 'utf8'));
	const files = collectCssFiles(targetDir);
	const perToken = new Map();
	let totalMixes = 0;
	let changedFiles = 0;
	for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
		const filePath = files[fileIndex];
		const original = readFileSync(filePath, 'utf8');
		const {
			text, mixes,
		} = transformText(original, tokenByRgb);
		if (mixes.length === 0) {
			continue;
		}
		changedFiles++;
		totalMixes += mixes.length;
		console.log(`\n${relative(process.cwd(), filePath)}  (${mixes.length})`);
		for (let mixIndex = 0; mixIndex < mixes.length; mixIndex++) {
			const token = mixes[mixIndex].token;
			perToken.set(token, (perToken.get(token) ?? 0) + 1);
		}
		if (!dryRun) {
			writeFileSync(filePath, text);
		}
	}
	console.log(`\n${dryRun ? 'DRY-RUN ' : ''}per-token mixes:`);
	for (const [
		token,
		count,
	] of [...perToken.entries()].sort()) {
		console.log(`  ${token} : ${count}`);
	}
	console.log(`${dryRun ? 'DRY-RUN ' : ''}${totalMixes} mixes across ${changedFiles} files`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
	run();
}
