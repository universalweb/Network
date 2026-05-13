import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
export default {
	input: './viat/centralSite/client/viatsdk/viatClient.js',
	output: {
		file: './viat/centralSite/client/viatsdk/viat-client-sdk-bundle.js',
		format: 'es',
		sourcemap: true,
		banner: '/* VIAT Client SDK - bundled (Rollup) */',
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
		inject({
			Buffer: ['buffer', 'Buffer'],
		}),
		commonjs({
			include: /node_modules/,
			transformMixedEsModules: true,
		}),
	],
	external: ['@universalweb/utilitylib'],
};
