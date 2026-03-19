import commonjs from '@rollup/plugin-commonjs';
import fs from 'node:fs';
import inject from '@rollup/plugin-inject';
import path from 'node:path';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
const configFilePath = decodeURIComponent(new URL(import.meta.url).pathname);
const configDirectory = path.dirname(configFilePath);
const projectRoot = path.resolve(configDirectory, '../..');
const utilitylibBrowserPath = path.join(projectRoot, 'node_modules/@universalweb/utilitylib/browser.js');
const utilitylibImportPattern = /import\s*\{([\s\S]*?)\}\s*from\s*['"]@universalweb\/utilitylib['"];?/gu;
function extractUtilitylibExports(importSource) {
	return importSource
		.split(',')
		.map((item) => {
			return item.trim();
		})
		.filter(Boolean)
		.map((item) => {
			return item.split(/\s+as\s+/u)[0]?.trim();
		})
		.filter((item) => {
			return Boolean(item) && (/^[$A-Z_a-z][$\w]*$/u).test(item);
		});
}
function collectUtilitylibExports(directoryPath, collectedExports = new Set()) {
	const entries = fs.readdirSync(directoryPath, {
		withFileTypes: true,
	});
	for (const entry of entries) {
		if (entry.name === '.git' || entry.name === 'node_modules') {
			continue;
		}
		const fullPath = path.join(directoryPath, entry.name);
		if (entry.isDirectory()) {
			collectUtilitylibExports(fullPath, collectedExports);
			continue;
		}
		if (!entry.isFile() || !(/\.(?:c|m)?js$/u).test(entry.name)) {
			continue;
		}
		const source = fs.readFileSync(fullPath, 'utf8');
		if (!source.includes('@universalweb/utilitylib')) {
			continue;
		}
		for (const match of source.matchAll(utilitylibImportPattern)) {
			for (const exportedName of extractUtilitylibExports(match[1])) {
				collectedExports.add(exportedName);
			}
		}
	}
	return [...collectedExports].sort();
}
function createUtilitylibGlobalProxyPlugin() {
	const proxyModuleId = '\0utilitylib-global-proxy';
	const utilitylibExports = collectUtilitylibExports(projectRoot);
	return {
		name: 'utilitylib-global-proxy',
		resolveId(source) {
			if (source === '@universalweb/utilitylib') {
				return proxyModuleId;
			}
		},
		load(id) {
			if (id !== proxyModuleId) {
				return null;
			}
			const exportLines = utilitylibExports.map((exportedName) => {
				return `export const ${exportedName} = utilitylib.${exportedName};`;
			}).join('\n');
			return `import ${JSON.stringify(utilitylibBrowserPath)};\nconst utilitylib = globalThis.$;\n${exportLines}\nexport default utilitylib;\n`;
		},
	};
}
export default {
	input: './viat/hdSeed/index.js',
	output: {
		file: './viat/hdSeed/hdseed-browser-bundle.min.js',
		format: 'iife',
		name: 'HDSEED',
		sourcemap: true,
		banner: '/* HDSEED Client - bundled (Rollup) */',
	},
	plugins: [
		createUtilitylibGlobalProxyPlugin(),
		replace({
			'process.env.NODE_ENV': JSON.stringify('production'),
			preventAssignment: true,
		}),
		resolve({
			browser: true,
			preferBuiltins: false,
			extensions: [
				'.js', '.mjs', '.cjs', '.json',
			],
			exportConditions: ['browser', 'default'],
		}),
		// Inject a Buffer polyfill for browser environments so modules that use Buffer work in the bundle
		inject({
			// whenever `Buffer` identifier is used, import it from the 'buffer' package
			Buffer: ['buffer', 'Buffer'],
		}),
		commonjs({
			include: /node_modules/,
			transformMixedEsModules: true,
		}),
		terser({
			format: {
				comments: false,
			},
		}),
	],
	// Let Rollup bundle node_modules (including @noble/curves/ed25519) into the output
	external: [],
};
