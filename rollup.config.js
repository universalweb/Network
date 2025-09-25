import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
export default {
	input: 'viat/centralSite/client/index.js',
	output: {
		file: 'viat/centralSite/client/viat-client.min.js',
		format: 'iife',
		name: 'VIAT',
		sourcemap: true,
		banner: '/* VIAT Client - bundled (Rollup) */',
	},
	plugins: [
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
