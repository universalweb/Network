/*
 * Physical → logical property rename codemod (sweep #2 · logical-props, css-style.md §3).
 *
 * Renames side-specific physical box/position properties to their writing-mode-aware
 * logical equivalents: LTR/horizontal-tb paint is IDENTICAL, but the result is
 * RTL-adaptive. The VALUE is untouched — only the property NAME changes. Same
 * declaration-oriented scan as tokenizeCss.js (matches a `;`-terminated `prop: value`,
 * so selectors like `.left:hover {` never match — no terminating `;` before `{`).
 *
 * Scope: padding/margin/border SIDES + positioning top/right/bottom/left → inset-*.
 * Deliberately EXCLUDES width/height (sizing slice; also the only transition-animated
 * props) and logical radius corners (error-prone start/end mapping). Idempotent.
 *
 *   node scripts/cssTokenize/logicalProps.js <targetDir> [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { collectCssFiles } from './tokenizeCss.js';
import { relative } from 'node:path';
/** Physical side → logical flow-relative side (LTR / horizontal-tb writing mode). */
const LOGICAL_SIDE = new Map([
	['top', 'block-start'],
	['bottom', 'block-end'],
	['left', 'inline-start'],
	['right', 'inline-end'],
]);
/**
 * Map a physical box/position property to its logical equivalent, or null if out of scope.
 * @param {string} property - The CSS property name.
 * @returns {string|null} The logical property name, or null to leave unchanged.
 */
export function renameProperty(property) {
	const boxMatch = (/^(padding|margin)-(top|bottom|left|right)$/).exec(property);
	if (boxMatch) {
		return `${boxMatch[1]}-${LOGICAL_SIDE.get(boxMatch[2])}`;
	}
	if (LOGICAL_SIDE.has(property)) {
		return `inset-${LOGICAL_SIDE.get(property)}`;
	}
	const borderMatch = (/^border-(top|bottom|left|right)(-(width|style|color))?$/).exec(property);
	if (borderMatch) {
		return `border-${LOGICAL_SIDE.get(borderMatch[1])}${borderMatch[2] ?? ''}`;
	}
	return null;
}
const DECLARATION_PATTERN = /(?<![\w-])([a-zA-Z][\w-]*)(\s*:\s*)([^;{}]+?)(\s*;)/g;
/**
 * Rename every in-scope physical declaration in a text blob, preserving the value
 * and all surrounding bytes. Idempotent.
 * @param {string} text - The CSS source.
 * @returns {{ text:string, renames:{from:string,to:string}[] }} New text + renames applied.
 */
export function transformText(text) {
	const renames = [];
	let result = '';
	let lastIndex = 0;
	const matches = text.matchAll(DECLARATION_PATTERN);
	for (const match of matches) {
		const property = match[1];
		const logical = renameProperty(property);
		if (!logical) {
			continue;
		}
		renames.push({
			from: property,
			to: logical,
		});
		result += `${text.slice(lastIndex, match.index)}${logical}${match[2]}${match[3]}${match[4]}`;
		lastIndex = match.index + match[0].length;
	}
	result += text.slice(lastIndex);
	return {
		text: result,
		renames,
	};
}
function run() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const targetDir = args.find((arg) => {
		return !arg.startsWith('--');
	});
	if (!targetDir) {
		console.error('usage: node logicalProps.js <targetDir> [--dry-run]');
		process.exitCode = 1;
		return;
	}
	const files = collectCssFiles(targetDir);
	let totalRenames = 0;
	let changedFiles = 0;
	for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
		const filePath = files[fileIndex];
		const original = readFileSync(filePath, 'utf8');
		const {
			text, renames,
		} = transformText(original);
		if (renames.length === 0) {
			continue;
		}
		changedFiles++;
		totalRenames += renames.length;
		console.log(`\n${relative(process.cwd(), filePath)}  (${renames.length})`);
		for (let renameIndex = 0; renameIndex < renames.length; renameIndex++) {
			const rename = renames[renameIndex];
			console.log(`  ${rename.from} -> ${rename.to}`);
		}
		if (!dryRun) {
			writeFileSync(filePath, text);
		}
	}
	console.log(`\n${dryRun ? 'DRY-RUN ' : ''}${totalRenames} renames across ${changedFiles} files`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
	run();
}
