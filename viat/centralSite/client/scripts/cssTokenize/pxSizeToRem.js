/*
 * px size-dimension → rem codemod (sweep #2 · sizing §1, css-style.md §1).
 *
 * A `px` on width/height is a defect (§1): it ignores the user's font-size/zoom and
 * traps the element at a fixed device size. Convert bare `Npx` in the size properties to
 * `(N/16)rem` so dimensions scale with the root (`html{font-size:clamp(14px,1.3vw,18px)}`)
 * and the user's a11y font preference. `N/16` is byte-identical at the 16px default root
 * (so the cascade baseline is unchanged), adaptive everywhere else — that is the feature,
 * not an identity guarantee at the runtime root.
 *
 * EXCLUDED (left as px): values containing a function — clamp()/min()/max()/calc()/var()
 * are already adaptive composites (judgment, not this slice); `0`; and **≤2px** width/height
 * — those are hairline dividers / `.sr-only` clip rects (`width:1px;height:1px`) that go
 * sub-pixel and blur/collapse under a narrow root (the §1 "1px stays px" rule, for
 * dimensions). Positioning/inset props are out of scope (tighter = safer). Idempotent.
 *
 *   node scripts/cssTokenize/pxSizeToRem.js <targetDir> [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { collectCssFiles } from './tokenizeCss.js';
import { relative } from 'node:path';
const SIZE_PROPS = new Set([
	'width',
	'height',
	'min-width',
	'max-width',
	'min-height',
	'max-height',
	'inline-size',
	'block-size',
	'min-inline-size',
	'max-inline-size',
	'min-block-size',
	'max-block-size',
]);
const DECLARATION_PATTERN = /(?<![\w-])([a-zA-Z][\w-]*)(\s*:\s*)([^;{}]+?)(\s*;)/g;
const PX_PATTERN = /(?<![\w.])(\d+(?:\.\d+)?)px\b/g;
const HAIRLINE_MAX_PX = 2;
/**
 * Format a px magnitude as a clean rem value (N/16), free of float noise.
 * @param {number} px - The px magnitude.
 * @returns {string} The rem token (e.g. "20rem", "3.25rem").
 */
function formatRem(px) {
	return `${Number((px / 16).toFixed(5))}rem`;
}
/**
 * Convert every bare px in a size-property value to rem, leaving hairline (≤2px) and 0
 * untouched. The value is only entered when it is a plain dimension (no function call).
 * @param {string} value - The declaration value.
 * @returns {{ value:string, subs:{px:number}[] }} New value + conversions applied.
 */
function convertValue(value) {
	const subs = [];
	let result = '';
	let lastIndex = 0;
	for (const match of value.matchAll(PX_PATTERN)) {
		const px = parseFloat(match[1]);
		if (px <= HAIRLINE_MAX_PX) {
			continue;
		}
		subs.push({
			px,
		});
		result += `${value.slice(lastIndex, match.index)}${formatRem(px)}`;
		lastIndex = match.index + match[0].length;
	}
	result += value.slice(lastIndex);
	return {
		value: result,
		subs,
	};
}
/**
 * Convert px size-dimensions to rem across a CSS blob, preserving all surrounding bytes.
 * Idempotent.
 * @param {string} text - The CSS source.
 * @returns {{ text:string, subs:{px:number}[] }} New text + conversions applied.
 */
export function transformText(text) {
	const subs = [];
	let result = '';
	let lastIndex = 0;
	for (const match of text.matchAll(DECLARATION_PATTERN)) {
		const value = match[3];
		if (!SIZE_PROPS.has(match[1].toLowerCase()) || value.includes('(')) {
			continue;
		}
		const converted = convertValue(value);
		if (converted.subs.length === 0) {
			continue;
		}
		for (let subIndex = 0; subIndex < converted.subs.length; subIndex++) {
			subs.push(converted.subs[subIndex]);
		}
		result += `${text.slice(lastIndex, match.index)}${match[1]}${match[2]}${converted.value}${match[4]}`;
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
		console.error('usage: node pxSizeToRem.js <targetDir> [--dry-run]');
		process.exitCode = 1;
		return;
	}
	const files = collectCssFiles(targetDir);
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
			console.log(`  ${subs[subIndex].px}px -> ${formatRem(subs[subIndex].px)}`);
		}
		if (!dryRun) {
			writeFileSync(filePath, text);
		}
	}
	console.log(`\n${dryRun ? 'DRY-RUN ' : ''}${totalSubs} conversions across ${changedFiles} files`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
	run();
}
